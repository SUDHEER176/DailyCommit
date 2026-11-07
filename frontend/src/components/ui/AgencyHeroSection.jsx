import React from 'react';
import HeroSection from './hero-01-utils/hero';
import BrandSlider from './hero-01-utils/brand-slider';
import ProductPreview from './ProductPreview';
import { isSignedIn } from '@/lib/userData';

const brandList = [
  'Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Stripe', 'LeetCode',
  'OpenAI', 'Uber', 'Airbnb', 'Spotify', 'Adobe', 'Palantir', 'Databricks', 'Coinbase',
].map((name) => ({ name }));

export default function AgencyHeroSection({ stats, currentUser, onOpenProblemModal, onNavigate }) {
  const signedIn = isSignedIn(currentUser);
  return (
    <div className="relative w-full">
      <HeroSection onOpenProblemModal={onOpenProblemModal} onNavigate={onNavigate} stats={stats} signedIn={signedIn} />
      <ProductPreview stats={stats} signedIn={signedIn} />
      <BrandSlider brandList={brandList} />
    </div>
  );
}
