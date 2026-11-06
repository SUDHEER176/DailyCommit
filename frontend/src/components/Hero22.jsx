import React from 'react';
import AgencyHeroSection from './ui/AgencyHeroSection';

/**
 * Hero Section matching the Agency / SaaS Hero layout
 * Includes stacked user avatars, social proof rating, crisp typography, and target company brand marquee.
 */
export default function Hero22({
  stats = {},
  todayTasks = [],
  onOpenTaskModal,
  onOpenProblemModal,
  onOpenAuthModal,
  setActiveTab,
  currentUser,
  activeTab,
  onNavigate
}) {
  return (
    <AgencyHeroSection
      stats={stats}
      todayTasks={todayTasks}
      onOpenTaskModal={onOpenTaskModal}
      onOpenProblemModal={onOpenProblemModal}
      onOpenAuthModal={onOpenAuthModal}
      onNavigate={onNavigate || setActiveTab}
      currentUser={currentUser}
      activeTab={activeTab}
    />
  );
}
