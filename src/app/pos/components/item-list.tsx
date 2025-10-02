
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
import { Button } from '@/components/ui/button';

const ITEMS_PER_PAGE = 50;

interface ItemListProps {
  category: Category | SpecialCategory | null;
  searchTerm: string;
  showFavoritesOnly: boolean;
  onItemClick: (item: Item) => void;
}

const ItemCard = ({ item, onClick }: { item: Item; onClick: (item: Item) => void }) => {
    const { 
        getCategoryColor,
        itemCardOpacity,
        itemCardShowImageAsBackground,
        itemCardImageOverlayOpacity,
        itemCardTextColor,
        itemCardShowPrice,
    } = usePos();
    const [isClicked, setIsClicked] = useState(false);

    const handleItemClick = () => {
        onClick(item);
        setIsClicked(true);
        setTimeout(() => setIsClicked(false), 200);
    };

    const showImage = item.showImage ?? true;
    const categoryColor = getCategoryColor(item.categoryId) || 'transparent';
    const cardStyle = {
      '--category-color': categoryColor,
      borderColor: 'var(--category-color)',
    } as React.CSSProperties;
    
    const textColorClass = itemCardTextColor === 'dark' ? 'text-gray-800' : 'text-white';
    const textShadowClass = itemCardTextColor === 'dark' ? 'text-shadow-none' : '[text-shadow:0_1px_2px_rgba(0,0,0,0.5)]';

    return (
      <Card
        className={cn(
          'flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-2',
          isClicked && 'scale-105 shadow-xl ring-2 ring-accent',
           itemCardShowImageAsBackground && 'relative'
        )}
        style={cardStyle}
      >
        <button onClick={handleItemClick} className="flex flex-col h-full text-left">
          {showImage && item.image ? (
            <CardHeader className="p-0">
              <div className={cn("relative w-full", itemCardShowImageAsBackground ? 'aspect-[4/3]' : 'aspect-video')}>
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className={cn("object-cover", itemCardShowImageAsBackground && 'z-0')}
                  data-ai-hint="product image"
                />
                 <div 
                    className={cn("absolute inset-0")}
                    style={{
                       background: itemCardShowImageAsBackground
                          ? `rgba(0,0,0,${itemCardImageOverlayOpacity/100})`
                          : `linear-gradient(to top, var(--category-color) 0%, transparent 50%)`,
                       opacity: !itemCardShowImageAsBackground ? itemCardOpacity / 100 : 1,
                    }}
                 />
              </div>
            </CardHeader>
          ) : <div className="aspect-video w-full" />}
           <div className={cn("flex flex-col flex-1", itemCardShowImageAsBackground && "absolute inset-0 p-3")}>
              <CardContent className={cn("flex-1 p-3", !showImage && "flex flex-col justify-center", itemCardShowImageAsBackground && 'mt-auto')}>
                  <h3 className={cn(
                      "font-semibold leading-tight", 
                      !showImage && "text-center",
                       itemCardShowImageAsBackground && `${textColorClass} ${textShadowClass}`
                  )}>{item.name}</h3>
              </CardContent>
              <CardFooter className={cn("flex items-center justify-between p-3 pt-0 mt-auto", !itemCardShowPrice && 'hidden')}>
                  <span className={cn("text-lg font-bold text-primary", itemCardShowImageAsBackground && `${textColorClass} ${textShadowClass}`)}>
                  {item.price.toFixed(2)}€
                  </span>
                  <PlusCircle className={cn("w-6 h-6 text-muted-foreground", itemCardShowImageAsBackground && 'text-white/70')} />
              </CardFooter>
           </div>
        </button>
      </Card>
    );
};

const ItemListItem = ({ item, onClick }: { item: Item, onClick: (item: Item) => void }) => {
    const { getCategoryColor } = usePos();
    const categoryColor = getCategoryColor(item.categoryId) || 'transparent';

    return (
        <div
            className="flex items-center gap-4 p-3 rounded-lg border-2 hover:border-primary hover:bg-secondary/50 transition-all cursor-pointer"
            onClick={() => onClick(item)}
            style={{ '--category-color': categoryColor, borderColor: 'var(--category-color)' } as React.CSSProperties}
        >
            {item.image && (
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                    <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        data-ai-hint="product image"
                    />
                </div>
            )}
            <div className="flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.price.toFixed(2)}€</p>
            </div>
            <Button variant="ghost" size="icon">
                <PlusCircle className="h-6 w-6 text-muted-foreground" />
            </Button>
        </div>
    );
}

export const ItemList = forwardRef<HTMLDivElement, ItemListProps>(
  ({ category, searchTerm, showFavoritesOnly, onItemClick }, ref) => {
    const { 
      items: allItems, 
      popularItems, 
      categories, 
      selectedTable, 
      itemDisplayMode,
    } = usePos();
    
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
    
    const paginatedItems = useMemo(() => {
      // If there is a search term, show all results. Otherwise, paginate.
      if (searchTerm) {
        return filteredItems;
      }
      return filteredItems.slice(0, ITEMS_PER_PAGE);
    }, [filteredItems, searchTerm]);


    const getCategoryColor = (categoryId: string) => {
      if (!categories) return 'transparent';
      return categories.find(c => c.id === categoryId)?.color;
    };

    if (itemDisplayMode === 'list') {
        return (
            <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {paginatedItems.map((item) => (
                    <ItemListItem key={item.id} item={item} onClick={onItemClick} />
                ))}
            </div>
        )
    }

    return (
      <div ref={ref} className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {paginatedItems.map((item) => (
          <ItemCard key={item.id} item={item} onClick={onItemClick} />
        ))}
      </div>
    );
  }
);

ItemList.displayName = 'ItemList';
