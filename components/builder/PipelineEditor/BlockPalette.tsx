'use client';

import * as React from 'react';
import clsx from 'clsx';
import styles from './BlockPalette.module.css';
import { BLOCK_TYPE } from '@/types/block-types';
import { useBlockDataStore } from '@/store/useBlockDataStore';
import { groupBlockDataToCategories } from '@/lib/utils/paletteGrouping';

// 전역 드래그 상태 (BlockPalette에서 사용)
let globalDragState: {
  blockType?: number
  isMove: boolean
  moveFrom?: any
} = { isMove: false }

type PaletteItem = {
  blockType: number;
  name: string;
  color: string;
};

type Category = {
  title: string;
  icon: string;
  color: string;
  items: PaletteItem[];
};

type Props = {
  className?: string;
};

export default function BlockPalette({ className }: Props) {
  const [clickedCategory, setClickedCategory] = React.useState<string | null>(null);
  const [bubblePosition, setBubblePosition] = React.useState<{ x: number; y: number } | null>(null);
  const { blockData, loading } = useBlockDataStore();

  const categories = React.useMemo<Category[]>(() => {
    if (!blockData || blockData.length === 0) return []
    return groupBlockDataToCategories(blockData)
  }, [blockData])

  const onDragStart = (e: React.DragEvent, item: PaletteItem) => {
    // 전역 드래그 상태 설정
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).blockPaletteDragState = {
        blockType: item.blockType,
        isMove: false
      }
    }
    console.log('onDragStart', item.blockType);
    // 블록 타입 정보 전달
    e.dataTransfer.setData('application/x-block-type', JSON.stringify({ blockType: item.blockType }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const onDragEnd = () => {
    // 드래그가 완료되면 팔레트 닫기
    setClickedCategory(null);
    setBubblePosition(null);
  };

  const handleCategoryClick = (categoryTitle: string, event: React.MouseEvent) => {
    if (clickedCategory === categoryTitle) {
      // 같은 카테고리를 다시 클릭하면 닫기
      setClickedCategory(null);
      setBubblePosition(null);
    } else {
      // 다른 카테고리 클릭 시 열기
      setClickedCategory(categoryTitle);
      const rect = event.currentTarget.getBoundingClientRect();
      setBubblePosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8 // 블록 팔레트 바로 위에 8px 마진
      });
    }
  };

  const handleBubbleClose = () => {
    setClickedCategory(null);
    setBubblePosition(null);
  };

  const currentCategory = categories.find(cat => cat.title === clickedCategory);

  return (
    <>
      <div
        className={clsx(
          styles.palette,
          className
        )}
      >
        {categories.map(category => (
          <div
            key={category.title}
            className={clsx(
              styles.categoryButton,
              clickedCategory === category.title && styles.categoryButtonActive
            )}
            onClick={(e) => handleCategoryClick(category.title, e)}
          >
            <div className={clsx(styles.categoryIcon, category.color)}>
              {category.icon}
            </div>
            <span className={styles.categoryLabel}>
              {category.title}
            </span>
          </div>
        ))}
      </div>

      {/* 클릭 버블창 */}
      {clickedCategory && currentCategory && bubblePosition && (
        <div
          className={styles.bubbleContainer}
          style={{
            left: `${bubblePosition.x}px`,
            top: `${bubblePosition.y}px`,
          }}
        >
          <div className={styles.bubble}>
            <div className={styles.bubbleHeader}>
              <span className={styles.bubbleTitle}>{currentCategory.title}</span>
              <button
                onClick={handleBubbleClose}
                className={styles.bubbleCloseButton}
                title="닫기"
              >
                ×
              </button>
            </div>
            <div className={styles.bubbleContent}>
              {currentCategory.items.map(item => (
                <div
                  key={item.blockType}
                  draggable
                  onDragStart={e => onDragStart(e, item)}
                  onDragEnd={onDragEnd}
                  className={clsx(styles.bubbleItem, item.color)}
                  title={`${item.name} 블록 드래그`}
                >
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}