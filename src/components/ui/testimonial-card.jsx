"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Card, CardContent } from "./card";

// --- Internal Sub-Components ---

// StatCard using shadcn variables
const StatCard = ({ value, label }) => (
  <Card className="bg-slate-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-center rounded-xl">
    <CardContent className="p-4">
      <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </CardContent>
  </Card>
);

// A sticky testimonial card for the stacking effect.
const StickyTestimonialCard = ({ testimonial, index }) => {
  return (
    <motion.div
      className="sticky w-full"
      style={{ top: `${96 + index * 24}px` }} // Staggered top position for stacking (96px clears the 64px navbar)
    >
      <div className={cn(
        "p-6 rounded-2xl shadow-lg flex flex-col h-auto w-full",
        "bg-white dark:bg-[#1a1d27] border border-slate-200 dark:border-slate-700/50"
      )}>
        {/* Top section: Image and Author */}
        <div className="flex items-center gap-4">
          {testimonial.avatarSrc ? (
            <div
              className="w-14 h-14 rounded-xl bg-cover bg-center flex-shrink-0"
              style={{ backgroundImage: `url(${testimonial.avatarSrc})` }}
              aria-label={`Photo of ${testimonial.name}`}
            />
          ) : (
            <div className="w-14 h-14 rounded-xl flex-shrink-0 bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
              {testimonial.name.charAt(0)}
            </div>
          )}
          <div className="flex-grow">
            <p className="font-semibold text-lg text-slate-900 dark:text-white">{testimonial.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.title}</p>
          </div>
        </div>

        {/* Middle section: Rating */}
        <div className="flex items-center gap-2 my-4">
          <span className="font-bold text-base text-slate-900 dark:text-white">{testimonial.rating.toFixed(1)}</span>
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < Math.floor(testimonial.rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-slate-300 dark:text-slate-700"
                )}
              />
            ))}
          </div>
        </div>

        {/* Bottom section: Quote */}
        {testimonial.quote && (
          <p className="text-base text-slate-600 dark:text-slate-300">&ldquo;{testimonial.quote}&rdquo;</p>
        )}
      </div>
    </motion.div>
  );
};

// --- Main Exported Component ---

export const ClientsSection = ({
  tagLabel,
  title,
  description,
  stats,
  testimonials,
  primaryActionLabel,
  secondaryActionLabel,
  className,
  onPrimaryClick,
  onSecondaryClick
}) => {
  // Calculate a height for the scroll container to ensure all cards can stack
  const scrollContainerHeight = testimonials.length > 0 ? `calc(100vh + ${testimonials.length * 100}px)` : 'auto';

  return (
    <section className={cn("w-full bg-slate-50 dark:bg-[#0f1117] py-20 md:py-28", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        
        {/* Left Column: Sticky Content */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-24 z-10">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-3 py-1 text-sm shadow-sm">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">{tagLabel}</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            {description}
          </p>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
          
          <div className="flex items-center gap-4 mt-6">
            <Button onClick={onSecondaryClick} variant="outline" size="lg" className="rounded-full border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">{secondaryActionLabel}</Button>
            <Button onClick={onPrimaryClick} size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">{primaryActionLabel}</Button>
          </div>
        </div>

        {/* Right Column: Container for the sticky card stack */}
        <div className="relative flex flex-col gap-4" style={{ height: scrollContainerHeight }}>
          {testimonials.length > 0 ? testimonials.map((testimonial, index) => (
            <StickyTestimonialCard
              key={index}
              index={index}
              testimonial={testimonial}
            />
          )) : (
            <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 text-center">Todavía no hay reseñas. ¡Sé el primero en comprar y comentar!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
