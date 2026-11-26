import React from 'react';

import LandingHero from './landing/LandingHero';
import PaperCards from './landing/PaperCards';
import ProofStrip from './landing/ProofStrip';
import SheetsSection from './landing/SheetsSection';
import SolveFlow from './landing/SolveFlow';
import TopicPicker from './landing/TopicPicker';
import FreeVsPro from './landing/FreeVsPro';
import Testimonials from './landing/Testimonials';
import FaqSection from './landing/FaqSection';
import PrepCta from './landing/PrepCta';
import TodayPlan from './landing/TodayPlan';

export default function Dashboard({ 
  stats, 
  todayTasks = [], 
  onToggleTask, 
  onOpenTaskModal, 
  onOpenProblemModal,
  onOpenAuthModal,
  currentUser,
  setActiveTab,
  activeTab,
  onNavigate
}) {
  // Scroll spy to update activeTab in navbar as user scrolls through sections
  React.useEffect(() => {
    const sectionIds = ['overview', 'today-plan', 'sheets', 'how-it-works', 'topics', 'compare', 'faqs'];
    const handleScroll = () => {
      const scrollPos = window.scrollY + 220;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPos) {
          if (setActiveTab) setActiveTab(sectionIds[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setActiveTab]);

  const signedIn = Boolean(currentUser?.isAuthenticated);

  return (
    <div className="relative space-y-24 sm:space-y-28">
      {/* Overview: the headline, the four paper cards and the strip under them */}
      <div id="overview" className="scroll-mt-24 space-y-6">
        <LandingHero onNavigate={onNavigate} />
        {/* The taped paper sheets: goals, the week, today and what comes back */}
        <div className="pt-10 sm:pt-12"><PaperCards onNavigate={onNavigate} /></div>
        <ProofStrip />
      </div>

      {/* Today's plan: the study plan's problems for today and the revisions due, on taped
          sheets. Signed in only; visitors don't get a mock to-do list */}
      {signedIn && <TodayPlan onNavigate={onNavigate} />}

      <SheetsSection onNavigate={onNavigate} />

      <SolveFlow />

      <TopicPicker onNavigate={onNavigate} />

      <FreeVsPro onNavigate={onNavigate} />

      <Testimonials />

      <FaqSection />

      <PrepCta onNavigate={onNavigate} />

      {/* Faint grid lines behind the page, like squared paper, fading out toward the edges.
          Last in the list so the section spacing above doesn't push the hero down */}
      <div className="landing-grid" aria-hidden />
    </div>
  );
}
