import CatalogSection from '@/components/home/CatalogParentsSection'
import HeroParentsSection from '@/components/home/HeroParentsSection'
import React from 'react'

export default function page() {
  return (
    <>
      <main className="pt-6 md:pt-8">
                <div className="space-y-10 md:space-y-14">
                    <HeroParentsSection />

                    <CatalogSection />
                </div>
            </main>
    </>
  )
}
