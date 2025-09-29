

'use client';

import React, { useState, useMemo, forwardRef } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { usePos } from '@/contexts/pos-context';
import { PlusCircle } from 'lucide-react';
import type { Category, SpecialCategory, Item } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ItemListProps {
  category: Category | SpecialCategory | null;
  searchTerm: string;
  showFavoritesOnly: boolean;
}

export const ItemList = forwardRef<HTMLDivElement, ItemListProps>(
  ({ category, searchTerm, showFavoritesOnly }, ref) => {
    const { addToOrder, items: allItems, popularItems, categories, itemCardOpacity, selectedTable, setVariantItem } = usePos();
    const [clickedItemId, setClickedItemId] = useState<string | null>(null);

    const handleItemClick = (item: Item) => {
      if (item.hasVariants && item.variantOptions && item.variantOptions.length > 0) {
        setVariantItem(item);
      } else {
        addToOrder(item.id);
        setClickedItemId(item.id);
        setTimeout(() => {
          setClickedItemId(null);
        }, 200); // L'effet dure 200ms
      }
    };
    
    const filteredItems = useMemo(() => {
      if (!allItems || !popularItems || !categories) return [];

      let itemsToFilter = allItems;

      // Determine the base list of items to filter
      if (showFavoritesOnly) {
        itemsToFilter = allItems.filter(item => item.isFavorite);
      } else if (category === 'popular') {
        itemsToFilter = popularItems;
      }

      // Filter by selected category (only if not 'all' or special views)
      if (category && typeof category === 'object' && category.id) {
          itemsToFilter = itemsToFilter.filter(item => item.categoryId === category.id);
      }

      // Apply search term filter
      let searchedItems = itemsToFilter.filter(item => {
        if (!searchTerm) return true;
        const lowerSearchTerm = searchTerm.toLowerCase();
        const nameMatch = item.name.toLowerCase().includes(lowerSearchTerm);
        const barcodeMatch = item.barcode ? item.barcode.toLowerCase().includes(lowerSearchTerm) : false;
        return nameMatch || barcodeMatch;
      });
      
      // In restaurant mode, further filter items to only include those in restaurant-dedicated categories
      if (selectedTable) {
          const restaurantCategoryIds = new Set(categories.filter(c => c.isRestaurantOnly).map(c => c.id));
          return searchedItems.filter(item => restaurantCategoryIds.has(item.categoryId));
      }

      return searchedItems;

    }, [allItems, popularItems, categories, category, searchTerm, showFavoritesOnly, selectedTable]);

    const getCategoryColor = (categoryId: string) => {
      if (!categories) return 'transparent';
      return categories.find(c => c.id === categoryId)?.color;
    };

    return (
      <div ref={ref} className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filteredItems.map((item) => {
          const showImage = item.showImage ?? true;
          const categoryColor = getCategoryColor(item.categoryId) || 'transparent';
          const cardStyle = {
            '--category-color': categoryColor,
            borderColor: 'var(--category-color)',
          } as React.CSSProperties;


          return (
            <Card
              key={item.id}
              className={cn(
                'flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-2',
                clickedItemId === item.id && 'scale-105 shadow-xl ring-2 ring-accent'
              )}
              style={cardStyle}
            >
              <button onClick={() => handleItemClick(item)} className="flex flex-col h-full text-left">
                {showImage && (
                  <CardHeader className="p-0">
                    <div className="relative aspect-video w-full">
                      <Image
                        src={item.image || 'https://picsum.photos/seed/placeholder/200/150'}
                        alt={item.name}
                        fill
                        className="object-cover"
                        data-ai-hint="product image"
                      />
                       <div 
                          className="absolute inset-0" 
                          style={{ background: `linear-gradient(to top, var(--category-color) 0%, transparent 50%)`, opacity: itemCardOpacity / 100 }}
                       />
                    </div>
                  </CardHeader>
                )}
                <CardContent className={cn("flex-1 p-3", !showImage && "flex flex-col justify-center")}>
                  <h3 className={cn("font-semibold leading-tight", !showImage && "text-center")}>{item.name}</h3>
                </CardContent>
                <CardFooter className="flex items-center justify-between p-3 pt-0 mt-auto">
                  <span className="text-lg font-bold text-primary">
                    {item.price.toFixed(2)}€
                  </span>
                  <PlusCircle className="w-6 h-6 text-muted-foreground" />
                </CardFooter>
              </button>
            </Card>
          )
        })}
      </div>
    );
  }
);

ItemList.displayName = 'ItemList';
