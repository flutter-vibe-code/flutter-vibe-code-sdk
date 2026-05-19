import { NextRequest, NextResponse } from 'next/server'
import { Polar } from '@polar-sh/sdk'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.POLAR_SERVER! as 'production' | 'sandbox',
})

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    try {
      // First, try to get the customer by external ID
      const customer = await polarClient.customers.getExternal({ 
        externalId: session.user.id 
      })
      
      // Create customer session for portal
      const customerSession = await polarClient.customerSessions.create({
        customerId: customer.id,
      })

      if (customerSession.customerPortalUrl) {
        return NextResponse.redirect(customerSession.customerPortalUrl)
      }
    } catch (customerError: any) {
      // If customer doesn't exist, try creating one
      if (customerError.detail?.[0]?.msg === 'Customer does not exist.') {
        try {
          const newCustomer = await polarClient.customers.create({
            email: session.user.email,
            externalId: session.user.id,
          })
          
          const customerSession = await polarClient.customerSessions.create({
            customerId: newCustomer.id,
          })

          if (customerSession.customerPortalUrl) {
            return NextResponse.redirect(customerSession.customerPortalUrl)
          }
        } catch (createError) {
          console.error('Error creating customer:', createError)
        }
      }
      throw customerError
    }

    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 400 })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}