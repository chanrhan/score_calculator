'use client';

import * as React from 'react';
import type { Component } from '@/types/domain';
import { ChevronRight } from 'lucide-react';
import styles from './TimelineBar.module.css';

interface TimelineBarProps {
  components: Component[];
  selectedComponentId?: number;
  onComponentClick?: (componentId: number) => void;
}

export default function TimelineBar({ 
  components, 
  selectedComponentId,
  onComponentClick 
}: TimelineBarProps) {
  // position 순서대로 정렬
  const sortedComponents = React.useMemo(() => {
    return [...components].sort((a, b) => a.position - b.position);
  }, [components]);

  if (sortedComponents.length === 0) {
    return null;
  }

  return (
    <div className={styles.timelineBar}>
      <div className={styles.timelineContainer}>
        {sortedComponents.map((component, index) => {
          const isSelected = selectedComponentId === component.id;
          const isLast = index === sortedComponents.length - 1;
          
          return (
            <React.Fragment key={component.id}>
              <div
                className={`${styles.timelineItem} ${isSelected ? styles.timelineItemSelected : ''}`}
                onClick={() => onComponentClick?.(component.id)}
                title={`컴포넌트 ${index + 1}`}
              >
                <div className={styles.timelineNumber}>{index + 1}</div>
                <div className={styles.timelineLabel}>
                  {component.name || `컴포넌트 ${index + 1}`}
                </div>
              </div>
              {!isLast && (
                <div className={styles.timelineConnector}>
                  <ChevronRight className={styles.connectorIcon} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

