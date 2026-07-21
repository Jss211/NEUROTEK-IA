import React, { useState, useEffect, useRef, useCallback } from 'react';
import imgJordan from '../../assets/ImagenJor.jpeg';
import imgLucas from '../../assets/imagenLucas.jpg';
import imgSofia from '../../assets/ImagenSofia.jpg';
import imgMateo from '../../assets/imagenMateo.jpg';
import imgRenato from '../../assets/ImagenRenato.jpg';
import imgAxel from '../../assets/imagenAxel.jpg';
import imgElena from '../../assets/ImagenElena.jpg';

const slides = [
  {
    title: 'Jordan',
    subtitle: 'Product Owner / Frontend',
    description: 'Dirige la visión estratégica del proyecto y coordina al equipo para transformar ideas en realidad. Apoya activamente en el desarrollo Frontend, asegurando que cada detalle visual cumpla con los más altos estándares de calidad y que la experiencia del usuario sea intuitiva, fluida y memorable desde el primer clic.',
    accent: '#574f6b', // Purple / Primary
    imageUrl: imgJordan,
  },
  {
    title: 'Lucas Müller',
    subtitle: 'Backend Developer',
    description: 'Es el arquitecto invisible que mantiene todo en funcionamiento. Se encarga de diseñar la infraestructura del servidor, optimizar las bases de datos y garantizar que todas tus transacciones sean rápidas y, sobre todo, 100% seguras contra cualquier amenaza cibernética.',
    accent: '#959ca7', // Blue
    imageUrl: imgLucas,
  },
  {
    title: 'Sofía Reyes',
    subtitle: 'Diseño Gráfico',
    description: 'La mente creativa detrás de nuestra identidad visual. Sofía conceptualiza y diseña cada banner, logotipo y elemento gráfico de la tienda, asegurándose de que la marca transmita una estética premium, moderna y alineada con la pasión por la tecnología de alto rendimiento.',
    accent: '#b9aab1', // Pink
    imageUrl: imgSofia,
  },
  {
    title: 'Mateo Silva',
    subtitle: 'Frontend Developer',
    description: 'Especialista en dar vida a los diseños estáticos. Mateo desarrolla interfaces dinámicas, implementa micro-interacciones fluidas y optimiza el rendimiento del código en el navegador para que tu navegación en la tienda sea increíblemente rápida, ya sea desde una PC Master Race o desde tu celular.',
    accent: '#b6c4bf', // Green
    imageUrl: imgMateo,
  },
  {
    title: 'Renato García',
    subtitle: 'DevOps Engineer',
    description: 'El encargado de mantener la infraestructura de nuestra aplicación en perfecto estado. Renato se asegura de que los despliegues sean rápidos, seguros y sin interrupciones, utilizando herramientas avanzadas de automatización para optimizar el rendimiento del sistema.',
    accent: '#afaaa1', // Amber
    imageUrl: imgRenato,
  },
  {
    title: 'Axel Rodríguez',
    subtitle: 'QA Specialist',
    description: 'El garante de la calidad en cada línea de código. Axel realiza pruebas exhaustivas para identificar y corregir errores antes de que lleguen a producción, asegurando que nuestra aplicación funcione sin problemas en todas las condiciones.',
    accent: '#c1bdcc', // Violet
    imageUrl: imgAxel,
  },
  {
    title: 'Elena Martínez',
    subtitle: 'Content Strategist',
    description: 'La voz que da forma a nuestra narrativa digital. Elena desarrolla estrategias de contenido que conectan con nuestro público objetivo, creando experiencias envolventes que fomentan la lealtad y el engagement con nuestra marca.',
    accent: '#dbcfcf', // Red
    imageUrl: imgElena,
  }
];

export default function ElegantCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef(null);
  const progressRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const SLIDE_DURATION = 6000;
  const TRANSITION_DURATION = 800;

  const goToSlide = useCallback((index) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setProgress(0);

    setTimeout(() => {
      setCurrentIndex(index);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, TRANSITION_DURATION / 2);
  }, [isTransitioning, currentIndex]);

  const goNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % slides.length;
    goToSlide(nextIndex);
  }, [currentIndex, goToSlide]);

  const goPrev = useCallback(() => {
    const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
    goToSlide(prevIndex);
  }, [currentIndex, goToSlide]);

  useEffect(() => {
    if (isPaused) return;

    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 100 / (SLIDE_DURATION / 50);
      });
    }, 50);

    intervalRef.current = setInterval(() => {
      goNext();
    }, SLIDE_DURATION);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [currentIndex, isPaused, goNext]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 60) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  const currentSlide = slides[currentIndex];

  return (
    <div
      className="relative w-full max-w-7xl mx-auto overflow-hidden rounded-[2rem] md:rounded-[3rem] bg-white dark:bg-[#13151f] border border-slate-200 dark:border-white/5 shadow-2xl group min-h-[400px] md:min-h-[450px] flex flex-col"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background accent wash */}
      <div
        className="absolute inset-0 transition-colors duration-1000 ease-in-out pointer-events-none opacity-30 dark:opacity-20"
        style={{
          background: `radial-gradient(circle at 70% 50%, ${currentSlide.accent}40 0%, transparent 60%)`,
        }}
      />

      <div className="flex flex-col lg:flex-row flex-grow relative z-10 h-full items-stretch">
        {/* Left: Text Content */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center h-full order-2 lg:order-1 relative p-6 md:p-10 lg:p-12 pb-24 md:pb-28 lg:pb-28">
          
          <div className={`transition-all duration-700 ease-in-out transform ${isTransitioning ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`}>
            {/* Collection number */}
            <div className="flex items-center gap-4 mb-6">
              <span className="w-12 h-[2px]" style={{ backgroundColor: currentSlide.accent, transition: 'background-color 1s ease' }} />
              <span className="text-sm font-bold tracking-widest text-slate-400 dark:text-slate-500 font-mono">
                {String(currentIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-3 leading-tight tracking-tight">
              {currentSlide.title}
            </h2>

            {/* Subtitle */}
            <p
              className="text-lg md:text-xl font-semibold mb-4 transition-colors duration-1000 ease-in-out"
              style={{ color: currentSlide.accent }}
            >
              {currentSlide.subtitle}
            </p>

            {/* Description */}
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-md">
              {currentSlide.description}
            </p>
          </div>

          {/* Navigation Arrows (Absolute to stay in place) */}
          <div className="flex gap-4 mt-auto">
            <button
              onClick={goPrev}
              className="w-12 h-12 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all"
              aria-label="Previous slide"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={goNext}
              className="w-12 h-12 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all"
              aria-label="Next slide"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right: Image */}
        <div className="w-full lg:w-1/2 min-h-[350px] sm:min-h-[450px] lg:min-h-full flex items-center justify-center order-1 lg:order-2 relative p-8 md:p-12 lg:p-16">
          <div className="relative w-full max-w-sm aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 mx-auto">
            <div className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${isTransitioning ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}>
              <img
                src={currentSlide.imageUrl}
                alt={currentSlide.title}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 opacity-30 transition-colors duration-1000 ease-in-out mix-blend-overlay"
                style={{
                  background: `linear-gradient(135deg, ${currentSlide.accent} 0%, transparent 100%)`,
                }}
              />
            </div>
            
            {/* Decorative frame corner (Top Left) */}
            <div 
              className="absolute top-4 left-4 w-8 h-8 md:w-10 md:h-10 border-t-2 border-l-2 transition-colors duration-1000 ease-in-out z-20 pointer-events-none rounded-tl-xl" 
              style={{ borderColor: 'rgba(255,255,255,0.4)' }} 
            />
            {/* Decorative frame corner (Bottom Right) */}
            <div 
              className="absolute bottom-4 right-4 w-8 h-8 md:w-10 md:h-10 border-b-2 border-r-2 transition-colors duration-1000 ease-in-out z-20 pointer-events-none rounded-br-xl" 
              style={{ borderColor: 'rgba(255,255,255,0.4)' }} 
            />
          </div>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="absolute bottom-6 md:bottom-10 left-0 w-full lg:w-1/2 px-8 md:px-12 lg:px-16 flex gap-4 md:gap-6 lg:gap-8 z-20">
        {slides.map((slide, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="flex-1 flex flex-col group relative"
            aria-label={`Go to slide ${index + 1}`}
          >
            {/* Track line */}
            <div className="w-full h-[2px] bg-slate-300 dark:bg-white/20 mb-3 relative overflow-hidden">
              {/* Progress fill */}
              <div
                className="absolute top-0 left-0 h-full bg-slate-800 dark:bg-white transition-all duration-300 ease-linear"
                style={{
                  width: index === currentIndex ? `${progress}%` : index < currentIndex ? '100%' : '0%',
                  opacity: index <= currentIndex ? 1 : 0
                }}
              />
            </div>
            {/* Text label */}
            <span 
              className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest text-left transition-colors duration-300
                ${index === currentIndex 
                  ? 'text-slate-900 dark:text-white' 
                  : 'text-slate-400 dark:text-white/40 group-hover:text-slate-600 dark:group-hover:text-white/70'}`}
            >
              {slide.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
