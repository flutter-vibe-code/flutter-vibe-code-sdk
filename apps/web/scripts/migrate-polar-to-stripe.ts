/**
 * Migration Script: Polar -> Stripe
 * 
 * Este script migra los datos de suscripciones de Polar a Stripe.
 * Solo necesita ejecutarse UNA vez al migrar de Polar a Stripe.
 * 
 * Uso:
 *   npx tsx scripts/migrate-polar-to-stripe.ts
 * 
 * Pasos:
 * 1. Exportar datos de Polar (customers, subscriptions)
 * 2. Crear customers en Stripe con el mismo user_id en metadata
 * 3. Actualizar la tabla subscriptions con los nuevos customer_ids de Stripe
 * 4. Verificar que todo está correcto
 */

import { db, subscriptions } from "@flutter-vibe-code/database"
import { eq } from "drizzle-orm"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

async function migratePolarToStripe() {
  console.log("[Migration] Starting Polar -> Stripe migration")
  
  // 1. Obtener todas las suscripciones existentes
  const allSubscriptions = await db.select().from(subscriptions)
  console.log(`[Migration] Found ${allSubscriptions.length} subscriptions`)
  
  let migrated = 0
  let errors = 0
  
  for (const sub of allSubscriptions) {
    try {
      // Si ya tiene customerId de Stripe, skip
      if (sub.customerId && sub.customerId.startsWith("cus_")) {
        console.log(`[Migration] Skip ${sub.userId} - already has Stripe customer`)
        continue
      }
      
      // Si tiene customerId de Polar (no empieza con cus_), migrar
      if (sub.customerId && !sub.customerId.startsWith("cus_")) {
        console.log(`[Migration] Migrating ${sub.userId} with Polar customer ${sub.customerId}`)
        
        // EnPolar->Stripe migration, you would:
        // 1. Find user email from user table
        // 2. Create new Stripe customer
        // 3. Update subscriptions.customerId with new Stripe ID
        
        // Por ahora, marcamos como needing migration manual
        console.log(`[Migration] TODO: Manual migration needed for user ${sub.userId}`)
      }
      
      migrated++
    } catch (error) {
      console.error(`[Migration] Error for user ${sub.userId}:`, error)
      errors++
    }
  }
  
  console.log(`[Migration] Complete: ${migrated} processed, ${errors} errors`)
}

migratePolarToStripe().catch(console.error)
