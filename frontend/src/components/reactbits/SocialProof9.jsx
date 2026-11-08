import React from 'react';
import { BRAND_COMPONENT_MAP } from '../ui/BrandLogos';

const defaultBrands = [
  'Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Stripe', 'LeetCode',
  'OpenAI', 'Uber', 'Airbnb', 'Spotify', 'Adobe', 'Palantir', 'Databricks', 'Coinbase',
].map((name) => ({ name }));

/**
 * Quiet, static logo row with the rating line above it. Logos are desaturated so they read as one set.
 */
export default function SocialProof9({
  title = 'Practice the patterns that come up in interviews at',
  brands,
  row1Brands,
  row2Brands,
  className = '',
}) {
  const list = brands?.length
    ? brands
    : row1Brands?.length || row2Brands?.length
      ? [...(row1Brands || []), ...(row2Brands || [])]
      : defaultBrands;

  return (
    <section className={`w-full py-12 border-y border-slate-200 dark:border-white/[0.08] ${className}`}>
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
      <ul className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-x-8 gap-y-4">
        {list.map((brand) => {
          const Icon = brand.icon || BRAND_COMPONENT_MAP[brand.name];
          return (
            <li
              key={brand.name}
              className="flex items-center gap-2 h-8 text-sm text-slate-500 dark:text-slate-400 [&_svg]:grayscale [&_svg]:opacity-70"
            >
              {Icon ? <Icon size={16} /> : null}
              <span>{brand.name}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
