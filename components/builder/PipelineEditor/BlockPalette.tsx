'use client';

import * as React from 'react';
import clsx from 'clsx';
import styles from './BlockPalette.module.css';
import { BLOCK_TYPE, BLOCK_TYPE_MAP } from '@/types/block-types';
import { BLOCK_TYPES } from '@/types/block-structure';

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

// BLOCK_TYPES에서 카테고리 생성
function createCategoriesFromBlockTypes(): Category[] {
  const categoryMap = new Map<string, Category>();

  // BLOCK_TYPE과 BLOCK_TYPES를 매핑하여 카테고리 생성
  const blockTypeMapping: Array<{ typeId: number; typeKey: keyof typeof BLOCK_TYPES; category: string }> = [
    { typeId: BLOCK_TYPE.APPLY_SUBJECT, typeKey: 'ApplySubject', category: '필터' },
    { typeId: BLOCK_TYPE.GRADE_RATIO, typeKey: 'GradeRatio', category: '필터' },
    { typeId: BLOCK_TYPE.APPLY_TERM, typeKey: 'ApplyTerm', category: '필터' },
    { typeId: BLOCK_TYPE.TOP_SUBJECT, typeKey: 'TopSubject', category: '필터' },
    { typeId: BLOCK_TYPE.SUBJECT_GROUP_RATIO, typeKey: 'SubjectGroupRatio', category: '필터' },
    { typeId: BLOCK_TYPE.SEPARATION_RATIO, typeKey: 'SeparationRatio', category: '필터' },
    { typeId: BLOCK_TYPE.SCORE_MAP, typeKey: 'ScoreMap', category: '필터' },
    { typeId: BLOCK_TYPE.FORMULA, typeKey: 'Formula', category: '변수' },
    { typeId: BLOCK_TYPE.VARIABLE, typeKey: 'Variable', category: '변수' },
    { typeId: BLOCK_TYPE.CONDITION, typeKey: 'Condition', category: '조건' },
    { typeId: BLOCK_TYPE.AGGREGATION, typeKey: 'Aggregation', category: '조건' },
    { typeId: BLOCK_TYPE.RATIO, typeKey: 'Ratio', category: '필터' },
    { typeId: BLOCK_TYPE.DECIMAL, typeKey: 'Decimal', category: '필터' },
  ];

  blockTypeMapping.forEach(({ typeId, typeKey, category: categoryTitle }) => {
    const blockType = BLOCK_TYPES[typeKey];
    if (!blockType) return;

    // 카테고리 아이콘과 색상 결정
    let categoryIcon = '⚙️';
    let categoryColor = 'bg-blue-500';
    
    if (categoryTitle === '구분') {
      categoryIcon = '📊';
      categoryColor = 'bg-green-500';
    } else if (categoryTitle === '조건') {
      categoryIcon = '🔍';
      categoryColor = 'bg-purple-500';
    } else if (categoryTitle === '변수') {
      categoryIcon = '📝';
      categoryColor = 'bg-pink-500';
    } else {
      categoryIcon = '🔧';
      categoryColor = 'bg-blue-500';
    }

    if (!categoryMap.has(categoryTitle)) {
      categoryMap.set(categoryTitle, {
        title: categoryTitle,
        icon: categoryIcon,
        color: categoryColor,
        items: []
      });
    }

    const category = categoryMap.get(categoryTitle)!;
    category.items.push({
      blockType: typeId,
      name: BLOCK_TYPE_MAP[typeId] || blockType.name,
      color: 'bg-blue-100 border-blue-300 text-blue-800'
    });
  });

  return Array.from(categoryMap.values());
}

export default function BlockPalette({ className }: Props) {
  const [clickedCategory, setClickedCategory] = React.useState<string | null>(null);
  const [bubblePosition, setBubblePosition] = React.useState<{ x: number; y: number } | null>(null);

  const categories = React.useMemo<Category[]>(() => {
    return createCategoriesFromBlockTypes();
  }, [])

  const onDragStart = (e: React.DragEvent, item: PaletteItem) => {
    // 전역 드래그 상태 설정
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).blockPaletteDragState = {
        blockType: item.blockType,
        isMove: false
      }
    }
    
    // 블록 타입 ID로부터 BLOCK_TYPES의 키 찾기
    const blockTypeMapping: Record<number, string> = {
      [BLOCK_TYPE.APPLY_SUBJECT]: 'applysubject',
      [BLOCK_TYPE.GRADE_RATIO]: 'graderatio',
      [BLOCK_TYPE.APPLY_TERM]: 'applyterm',
      [BLOCK_TYPE.TOP_SUBJECT]: 'topsubject',
      [BLOCK_TYPE.SUBJECT_GROUP_RATIO]: 'subjectgroupratio',
      [BLOCK_TYPE.SEPARATION_RATIO]: 'separationratio',
      [BLOCK_TYPE.SCORE_MAP]: 'scoremap',
      [BLOCK_TYPE.FORMULA]: 'formula',
      [BLOCK_TYPE.VARIABLE]: 'variable',
      [BLOCK_TYPE.CONDITION]: 'condition',
      [BLOCK_TYPE.AGGREGATION]: 'aggregation',
      [BLOCK_TYPE.RATIO]: 'ratio',
      [BLOCK_TYPE.DECIMAL]: 'decimal',
    };
    
    const kind = blockTypeMapping[item.blockType] || '';
    
    console.log('onDragStart', item.blockType, 'kind:', kind);
    
    // ComponentNode에서 기대하는 형식으로 전달 (application/x-block-kind)
    e.dataTransfer.setData('application/x-block-kind', kind);
    // 호환성을 위해 기존 형식도 유지
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