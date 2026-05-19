"use client"

import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "../lib/utils"

interface HoverCardProps extends React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Root> {
  noHover?: boolean
}

const HoverCard = React.forwardRef<
  HTMLDivElement,
  HoverCardProps
>(({ noHover, children, ...props }, ref) => {
  if (noHover) {
    return (
      <PopoverPrimitive.Root {...props}>
        {children}
      </PopoverPrimitive.Root>
    )
  }
  return (
    <HoverCardPrimitive.Root {...props}>
      {children}
    </HoverCardPrimitive.Root>
  )
})
HoverCard.displayName = "HoverCard"

interface HoverCardTriggerProps extends React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Trigger> {
  noHover?: boolean
}

const HoverCardTrigger = React.forwardRef<
  HTMLElement,
  HoverCardTriggerProps
>(({ noHover, ...props }, ref) => {
  if (noHover) {
    return <PopoverPrimitive.Trigger ref={ref as React.Ref<HTMLButtonElement>} {...props as any} />
  }
  return <HoverCardPrimitive.Trigger ref={ref as React.Ref<HTMLAnchorElement>} {...props} />
})
HoverCardTrigger.displayName = "HoverCardTrigger"

interface HoverCardContentProps extends React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> {
  noHover?: boolean
}

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  HoverCardContentProps
>(({ className, align = "center", sideOffset = 4, noHover, onPointerLeave, ...props }, ref) => {
  const contentClass = cn(
    "z-[100] w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
    className
  )

  if (noHover) {
    return (
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          ref={ref}
          align={align}
          sideOffset={sideOffset}
          className={contentClass}
          onOpenAutoFocus={(e) => e.preventDefault()}
          {...props}
        />
      </PopoverPrimitive.Portal>
    )
  }

  return (
    <HoverCardPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={contentClass}
      onPointerLeave={onPointerLeave}
      {...props}
    />
  )
})
HoverCardContent.displayName = "HoverCardContent"

export { HoverCard, HoverCardTrigger, HoverCardContent }
