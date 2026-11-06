import React from 'react';
import HeroSection from './hero-01-utils/hero';
import BrandSlider from './hero-01-utils/brand-slider';
import ProductPreview from './ProductPreview';

const brandList = [
  'Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Stripe', 'LeetCode',
  'OpenAI', 'Uber', 'Airbnb', 'Spotify', 'Adobe', 'Palantir', 'Databricks', 'Coinbase',
].map((name) => ({ name }));

export default function AgencyHeroSection({ stats, onOpenProblemModal, onNavigate }) {
  return (
    <div className="relative w-full">
      <HeroSection onOpenProblemModal={onOpenProblemModal} onNavigate={onNavigate} />
      <ProductPreview stats={stats} />
      <BrandSlider brandList={brandList} />
    </div>
  );
}
