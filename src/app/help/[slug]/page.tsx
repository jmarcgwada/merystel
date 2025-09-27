'use client';

import { useParams } from 'next/navigation';
import { helpData } from '../help-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookQuestion } from 'lucide-react';
import React from 'react';

// This function finds the content for a given slug
function getTopicBySlug(slug: string) {
  for (const category of helpData) {
    const topic = category.topics.find((t) => t.slug === slug);
    if (topic) {
      return topic;
    }
  }
  return null;
}

// Simple markdown-to-HTML parser
const parseContent = (content: string) => {
    const lines = content.trim().split('\\n');
    const elements = [];
    let listType: 'ul' | 'ol' | null = null;
    let listItems: React.ReactNode[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            if (listType === 'ul') {
                elements.push(<ul key={elements.length} className="list-disc list-inside space-y-2 my-4 pl-4">{listItems}</ul>);
            }
            listItems = [];
            listType = null;
        }
    };

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (line.startsWith('**') && line.endsWith('**')) {
            flushList();
            elements.push(<h3 key={i} className="text-xl font-semibold mt-6 mb-2">{line.substring(2, line.length - 2)}</h3>);
        } else if (line.startsWith('- ')) {
            if (listType !== 'ul') {
                flushList();
                listType = 'ul';
            }
            listItems.push(<li key={i}>{line.substring(2)}</li>);
        } else if (line.match(/^\d+\.\s/)) {
            if (listType !== 'ol') {
                 flushList();
                 listType = 'ol';
            }
            listItems.push(<li key={i}>{line.substring(line.indexOf(' ') + 1)}</li>);
        } else if (line) {
            flushList();
            elements.push(<p key={i} className="leading-relaxed mb-4">{line}</p>);
        }
    }
    
    flushList(); // Add any remaining list items
    return elements;
};


export default function HelpTopicPage() {
  const params = useParams();
  const slug = params.slug as string;
  const topic = getTopicBySlug(slug);

  if (!topic) {
    return (
        <Alert variant="destructive">
            <BookQuestion className="h-4 w-4" />
            <AlertTitle>Sujet introuvable</AlertTitle>
            <AlertDescription>
                La page d'aide que vous recherchez n'existe pas. Veuillez sélectionner un sujet dans le menu de gauche.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-headline">{topic.title}</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm max-w-none">
        {parseContent(topic.content)}
      </CardContent>
    </Card>
  );
}
