import React from 'react';
import SocialProof9 from '../../reactbits/SocialProof9';

/**
 * Static logo row under the hero preview.
 */
export default function BrandSlider({ brandList = [] }) {
  return <SocialProof9 brands={brandList} className="mt-24" />;
}

export { SocialProof9 };
