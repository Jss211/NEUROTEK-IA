import React from "react"
import { cn } from "../../lib/utils"

const keyframesStyle = `
@keyframes animated-gradient-text {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`

export function GradientText({
  className,
  children,
  as: Component = "span",
  colors = "#00f3ff, #8b5cf6, #00f3ff",
  style,
  ...props
}) {
  return (
    <Component
      className={cn(
        "inline-block text-transparent bg-clip-text",
        className
      )}
      style={{
        backgroundImage: \`linear-gradient(90deg, \${colors})\`,
        backgroundSize: "300% 300%",
        animation: "animated-gradient-text 8s ease infinite",
        ...style
      }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: keyframesStyle }} />
      {children}
    </Component>
  )
}

GradientText.displayName = "GradientText"
export default GradientText;
