'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { helpData } from "./help-data";
import { ArrowRight } from "lucide-react";

export default function HelpPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bienvenue dans la section d'aide</CardTitle>
        <CardDescription>
          Parcourez les catégories ci-dessous pour en savoir plus sur chaque fonctionnalité de l'application. 
          Cliquez sur un sujet pour voir les détails.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {helpData.map((category) => (
            <AccordionItem value={category.category} key={category.category}>
              <AccordionTrigger className="text-lg font-semibold">{category.category}</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-2 pt-2">
                  {category.topics.map((topic) => (
                     <Link href={`/help/${topic.slug}`} key={topic.slug} className="group flex items-center justify-between rounded-md p-3 hover:bg-secondary">
                        <span>{topic.title}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
