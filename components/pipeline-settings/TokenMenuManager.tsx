'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X, Trash2, Edit2, Check, X as XIcon, GripVertical, Menu, List } from 'lucide-react'
import styles from './TokenMenuManager.module.css'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TokenMenuManagerProps {
  univId: string
}

interface SortableTokenMenuItemProps {
  item: any
  index: number
  editingItem: string | null
  editItemData: Record<string, any>
  setEditItemData: (data: Record<string, any>) => void
  handleStartEditItem: (item: any) => void
  handleCancelEditItem: () => void
  handleSaveEditItem: (item: any) => void
  handleDeleteTokenMenuItem: (order: number) => void
  univId: string
}

function SortableTokenMenuItem({
  item,
  index,
  editingItem,
  editItemData,
  setEditItemData,
  handleStartEditItem,
  handleCancelEditItem,
  handleSaveEditItem,
  handleDeleteTokenMenuItem,
  univId
}: SortableTokenMenuItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.order })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isEditing = editingItem === `${item.menu_key}-${item.order}`

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      className="hover:bg-gray-50 group"
    >
      <td>
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className={styles.dragHandle}
            disabled={isEditing}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-500">{index + 1}</span>
        </div>
      </td>
      <td>
        {isEditing ? (
          <input 
            className={styles.inputField}
            value={editItemData.label || ''} 
            onChange={e => setEditItemData({ ...editItemData, label: e.target.value })} 
          />
        ) : (
          item.label
        )}
      </td>
      <td>
        {isEditing ? (
          <input 
            className={styles.inputField}
            value={editItemData.value || ''} 
            onChange={e => setEditItemData({ ...editItemData, value: e.target.value })} 
          />
        ) : (
          item.value
        )}
      </td>
      <td>
        <div className={styles.itemActions}>
          {isEditing ? (
            <>
              <button 
                className={`${styles.actionButton} ${styles.save}`}
                onClick={() => handleSaveEditItem(item)}
                disabled={!univId}
                title="저장"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button 
                className={`${styles.actionButton} ${styles.cancel}`}
                onClick={handleCancelEditItem}
                title="취소"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <button 
                className={`${styles.actionButton} ${styles.edit}`}
                onClick={() => handleStartEditItem(item)}
                disabled={!univId}
                title="편집"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button 
                className={`${styles.actionButton} ${styles.delete}`}
                onClick={() => handleDeleteTokenMenuItem(item.order)}
                disabled={!univId}
                title="삭제"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function TokenMenuManager({ univId }: TokenMenuManagerProps) {
  // Token Menu 관련 상태
  const [tokenMenus, setTokenMenus] = useState<any[]>([])
  const [selectedMenuKey, setSelectedMenuKey] = useState<string>('')
  const [tokenMenuItems, setTokenMenuItems] = useState<any[]>([])
  const [newTokenMenu, setNewTokenMenu] = useState<Record<string, string>>({})
  const [newTokenMenuItem, setNewTokenMenuItem] = useState<Record<string, any>>({})
  
  // 편집 상태 관리
  const [editingMenu, setEditingMenu] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editMenuData, setEditMenuData] = useState<Record<string, string>>({})
  const [editItemData, setEditItemData] = useState<Record<string, any>>({})

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 입력 필드 ref
  const tokenMenuKeyRef = useRef<HTMLInputElement>(null)
  const tokenMenuItemLabelRef = useRef<HTMLInputElement>(null)

  // Token Menu 관련 함수들
  const loadTokenMenus = async () => {
    if (!univId) return
    try {
      const response = await fetch(`/api/token-menus/${univId}`)
      if (response.ok) {
        const data = await response.json()
        setTokenMenus(data)
      }
    } catch (error) {
      console.error('Error loading token menus:', error)
    }
  }

  const loadTokenMenuItems = async (menuKey: string) => {
    if (!univId || !menuKey) return
    try {
      const response = await fetch(`/api/token-menus/${univId}/${menuKey}`)
      if (response.ok) {
        const data = await response.json()
        setTokenMenuItems(data.items || [])
      }
    } catch (error) {
      console.error('Error loading token menu items:', error)
    }
  }

  const handleCreateTokenMenu = async () => {
    if (!univId) return alert('대학교를 선택해주세요')
    if (!newTokenMenu.key || !newTokenMenu.name) return alert('키와 이름을 입력해주세요')

    try {
      const response = await fetch(`/api/token-menus/${univId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newTokenMenu.key,
          name: newTokenMenu.name,
          scope: 0, // 기본값: 대학교별
        }),
      })

      if (response.ok) {
        setNewTokenMenu({})
        loadTokenMenus()
      } else {
        const error = await response.json()
        alert(error.error || '토큰 메뉴 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error creating token menu:', error)
      alert('토큰 메뉴 생성 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteTokenMenu = async (menuKey: string) => {
    if (!univId) return
    if (!confirm('이 토큰 메뉴를 삭제하시겠습니까?')) return

    // 삭제할 메뉴의 실제 univ_id 찾기
    const menuToDelete = tokenMenus.find(menu => menu.key === menuKey)
    if (!menuToDelete) return alert('삭제할 메뉴를 찾을 수 없습니다')

    try {
      const response = await fetch(`/api/token-menus/${menuToDelete.univ_id}/${menuKey}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadTokenMenus()
        if (selectedMenuKey === menuKey) {
          setSelectedMenuKey('')
          setTokenMenuItems([])
        }
      } else {
        const error = await response.json()
        alert(error.error || '토큰 메뉴 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error deleting token menu:', error)
      alert('토큰 메뉴 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleCreateTokenMenuItem = async () => {
    if (!univId || !selectedMenuKey) return alert('토큰 메뉴를 선택해주세요')
    if (!newTokenMenuItem.label || !newTokenMenuItem.value) {
      return alert('라벨과 값을 입력해주세요')
    }

    // 선택된 메뉴의 실제 univ_id 찾기
    const selectedMenu = tokenMenus.find(menu => menu.key === selectedMenuKey)
    if (!selectedMenu) return alert('선택된 메뉴를 찾을 수 없습니다')

    try {
      const response = await fetch(`/api/token-menu-items/${selectedMenu.univ_id}/${selectedMenuKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newTokenMenuItem.label,
          value: newTokenMenuItem.value,
        }),
      })

      if (response.ok) {
        setNewTokenMenuItem({})
        loadTokenMenuItems(selectedMenuKey)
      } else {
        const error = await response.json()
        alert(error.error || '토큰 메뉴 항목 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error creating token menu item:', error)
      alert('토큰 메뉴 항목 생성 중 오류가 발생했습니다.')
    }
  }

  // 드래그 앤 드롭 핸들러
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = tokenMenuItems.findIndex(item => item.order === active.id)
      const newIndex = tokenMenuItems.findIndex(item => item.order === over?.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(tokenMenuItems, oldIndex, newIndex)
        
        // 순서 업데이트
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          order: index + 1
        }))

        setTokenMenuItems(updatedItems)

        // 서버에 순서 업데이트 요청
        try {
          // 선택된 메뉴의 실제 univ_id 찾기
          const selectedMenu = tokenMenus.find(menu => menu.key === selectedMenuKey)
          if (!selectedMenu) {
            loadTokenMenuItems(selectedMenuKey)
            alert('선택된 메뉴를 찾을 수 없습니다')
            return
          }

          const response = await fetch(`/api/token-menu-items/${selectedMenu.univ_id}/${selectedMenuKey}/reorder`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: updatedItems.map(item => ({
                order: item.order,
                label: item.label,
                value: item.value
              }))
            }),
          })

          if (!response.ok) {
            // 실패 시 원래 상태로 복원
            loadTokenMenuItems(selectedMenuKey)
            const error = await response.json()
            alert(error.error || '순서 변경에 실패했습니다.')
          }
        } catch (error) {
          console.error('Error reordering token menu items:', error)
          loadTokenMenuItems(selectedMenuKey)
          alert('순서 변경 중 오류가 발생했습니다.')
        }
      }
    }
  }

  const handleDeleteTokenMenuItem = async (order: number) => {
    if (!univId || !selectedMenuKey) return
    if (!confirm('이 항목을 삭제하시겠습니까?')) return

    // 선택된 메뉴의 실제 univ_id 찾기
    const selectedMenu = tokenMenus.find(menu => menu.key === selectedMenuKey)
    if (!selectedMenu) return alert('선택된 메뉴를 찾을 수 없습니다')

    try {
      const response = await fetch(`/api/token-menu-items/${selectedMenu.univ_id}/${selectedMenuKey}/${order}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadTokenMenuItems(selectedMenuKey)
      } else {
        const error = await response.json()
        alert(error.error || '토큰 메뉴 항목 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error deleting token menu item:', error)
      alert('토큰 메뉴 항목 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleToggleCommon = async (menuKey: string, currentUnivId: string) => {
    if (!univId) return alert('대학교를 선택해주세요')

    try {
      const response = await fetch(`/api/token-menus/${currentUnivId}/${menuKey}/toggle-common`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUnivId: univId,
        }),
      })

      if (response.ok) {
        loadTokenMenus()
        // 성공 시에는 alert 표시하지 않음
      } else {
        const error = await response.json()
        alert(error.error || '공통 설정 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error toggling common status:', error)
      alert('공통 설정 변경 중 오류가 발생했습니다.')
    }
  }

  // 토큰 메뉴 편집 함수들
  const handleStartEditMenu = (menu: any) => {
    setEditingMenu(menu.key)
    setEditMenuData({
      key: menu.key,
      name: menu.name,
      scope: menu.scope.toString()
    })
  }

  const handleCancelEditMenu = () => {
    setEditingMenu(null)
    setEditMenuData({})
  }

  const handleSaveEditMenu = async (menuKey: string) => {
    if (!univId) return alert('대학교를 선택해주세요')
    if (!editMenuData.name || !editMenuData.key) return alert('키와 이름을 입력해주세요')

    try {
      const response = await fetch(`/api/token-menus/${univId}/${menuKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: editMenuData.key,
          name: editMenuData.name,
          scope: parseInt(editMenuData.scope)
        }),
      })

      if (response.ok) {
        setEditingMenu(null)
        setEditMenuData({})
        loadTokenMenus()
      } else {
        const error = await response.json()
        alert(error.error || '토큰 메뉴 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error updating token menu:', error)
      alert('토큰 메뉴 수정 중 오류가 발생했습니다.')
    }
  }

  // 토큰 메뉴 항목 편집 함수들
  const handleStartEditItem = (item: any) => {
    setEditingItem(`${item.menu_key}-${item.order}`)
    setEditItemData({
      label: item.label,
      value: item.value
    })
  }

  const handleCancelEditItem = () => {
    setEditingItem(null)
    setEditItemData({})
  }

  const handleSaveEditItem = async (item: any) => {
    if (!univId || !selectedMenuKey) return alert('대학교와 토큰 메뉴를 선택해주세요')
    if (!editItemData.label || !editItemData.value) {
      return alert('라벨과 값을 모두 입력해주세요')
    }

    // 선택된 메뉴의 실제 univ_id 찾기
    const selectedMenu = tokenMenus.find(menu => menu.key === selectedMenuKey)
    if (!selectedMenu) return alert('선택된 메뉴를 찾을 수 없습니다')

    try {
      const response = await fetch(`/api/token-menu-items/${selectedMenu.univ_id}/${selectedMenuKey}/${item.order}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: editItemData.label,
          value: editItemData.value
        }),
      })

      if (response.ok) {
        setEditingItem(null)
        setEditItemData({})
        loadTokenMenuItems(selectedMenuKey)
      } else {
        const error = await response.json()
        alert(error.error || '토큰 메뉴 항목 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error updating token menu item:', error)
      alert('토큰 메뉴 항목 수정 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    loadTokenMenus()
  }, [univId])

  useEffect(() => {
    if (selectedMenuKey) {
      loadTokenMenuItems(selectedMenuKey)
    }
  }, [selectedMenuKey, univId])

  return (
    <div className={styles.container}>
      {/* 왼쪽 패널 - 토큰 메뉴 관리 */}
      <div className={styles.leftPanel}>
        <div className={styles.panelHeader}>
          <CardTitle className="flex items-center gap-2">
            <Menu className="h-5 w-5" />
            토큰 메뉴
          </CardTitle>
          <CardDescription>
            드롭다운 메뉴의 기본 설정을 관리합니다.
          </CardDescription>
        </div>
        <div className={styles.panelContent}>
          {/* 새 메뉴 추가 폼 */}
          <div className={styles.newMenuForm}>
            <div className={styles.formRow}>
              <input 
                className={styles.inputField}
                value={newTokenMenu.key || ''} 
                onChange={e => setNewTokenMenu({ ...newTokenMenu, key: e.target.value })} 
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleCreateTokenMenu()
                  }
                }}
                placeholder="메뉴 키" 
              />
            </div>
            <div className={styles.formRow}>
              <input 
                className={styles.inputField}
                value={newTokenMenu.name || ''} 
                onChange={e => setNewTokenMenu({ ...newTokenMenu, name: e.target.value })} 
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleCreateTokenMenu()
                  }
                }}
                placeholder="메뉴 이름" 
              />
            </div>
            <div className={styles.formRow}>
              <button 
                className={styles.addButton}
                onClick={handleCreateTokenMenu} 
                disabled={!univId}
              >
                <Plus className="h-4 w-4" />
                추가
              </button>
            </div>
          </div>

          {/* 메뉴 목록 */}
          <div className={styles.menuList}>
            {tokenMenus.length === 0 ? (
              <div className={styles.emptyState}>
                <Menu className={styles.emptyStateIcon} />
                <p>토큰 메뉴가 없습니다.</p>
                <p className="text-sm mt-1">새 메뉴를 추가해보세요.</p>
              </div>
            ) : (
              // 특정 키는 토큰 관리 탭에서 숨김 처리
              // 숨김 대상: admission_code, major_code, organization_code
              tokenMenus
                .filter((menu) => !['admission_code', 'major_code', 'organization_code'].includes(menu.key))
                .map((menu) => (
                <div 
                  key={menu.key} 
                  className={`${styles.menuItem} ${selectedMenuKey === menu.key ? styles.selected : ''}`}
                  onClick={() => setSelectedMenuKey(menu.key)}
                >
                  <div className={styles.menuItemHeader}>
                    <span className={styles.menuItemName}>{menu.name}</span>
                    <span className={`${styles.menuItemStatus} ${menu.scope === 1 ? styles.common : styles.university}`}>
                      {menu.scope === 1 ? '공통' : '대학교별'}
                    </span>
                  </div>
                  <div className={styles.menuItemKey}>{menu.key}</div>
                  
                  {editingMenu === menu.key ? (
                    <div className={styles.menuActions}>
                      <button 
                        className={`${styles.actionButton} ${styles.save}`}
                        onClick={() => handleSaveEditMenu(menu.key)}
                        disabled={!univId}
                        title="저장"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        className={`${styles.actionButton} ${styles.cancel}`}
                        onClick={handleCancelEditMenu}
                        title="취소"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className={styles.menuActions}>
                      <button 
                        className={`${styles.actionButton} ${styles.edit}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartEditMenu(menu)
                        }}
                        disabled={!univId}
                        title="편집"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        className={`${styles.actionButton} ${styles.toggle}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleCommon(menu.key, menu.univ_id)
                        }}
                        disabled={!univId}
                        title={menu.scope === 1 ? '공통 해제' : '공통 설정'}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                      </button>
                      <button 
                        className={`${styles.actionButton} ${styles.delete}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTokenMenu(menu.key)
                        }}
                        disabled={!univId}
                        title="삭제"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 오른쪽 패널 - 토큰 메뉴 항목 관리 */}
      <div className={styles.rightPanel}>
        <div className={styles.panelHeader}>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            메뉴 항목
          </CardTitle>
          <CardDescription>
            {selectedMenuKey ? `${tokenMenus.find(m => m.key === selectedMenuKey)?.name} 항목들을 관리합니다.` : '왼쪽에서 메뉴를 선택하세요.'}
          </CardDescription>
        </div>
        <div className={styles.panelContent}>
          {!selectedMenuKey ? (
            <div className={styles.noSelection}>
              <Menu className={styles.noSelectionIcon} />
              <h3 className="text-lg font-medium mb-2">메뉴를 선택하세요</h3>
              <p className="text-sm">왼쪽에서 토큰 메뉴를 선택하면<br />해당 메뉴의 항목들을 관리할 수 있습니다.</p>
            </div>
          ) : (
            <>
              {/* 새 항목 추가 */}
              <div className="mb-4 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                <h4 className="text-sm font-medium mb-3">새 항목 추가</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    className={styles.inputField}
                    value={newTokenMenuItem.label || ''} 
                    onChange={e => setNewTokenMenuItem({ ...newTokenMenuItem, label: e.target.value })} 
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleCreateTokenMenuItem()
                      }
                    }}
                    placeholder="라벨" 
                  />
                  <input 
                    className={styles.inputField}
                    value={newTokenMenuItem.value || ''} 
                    onChange={e => setNewTokenMenuItem({ ...newTokenMenuItem, value: e.target.value })} 
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleCreateTokenMenuItem()
                      }
                    }}
                    placeholder="값" 
                  />
                </div>
                <div className="mt-3">
                  <button 
                    className={styles.addButton}
                    onClick={handleCreateTokenMenuItem} 
                    disabled={!univId || !selectedMenuKey}
                  >
                    <Plus className="h-4 w-4" />
                    항목 추가
                  </button>
                </div>
              </div>

              {/* 항목 목록 */}
              {tokenMenuItems.length === 0 ? (
                <div className={styles.emptyState}>
                  <List className={styles.emptyStateIcon} />
                  <p>메뉴 항목이 없습니다.</p>
                  <p className="text-sm mt-1">새 항목을 추가해보세요.</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={tokenMenuItems.map(item => item.order)}
                      strategy={verticalListSortingStrategy}
                    >
                      <table className={styles.itemsTable}>
                        <thead>
                          <tr>
                            <th>순서</th>
                            <th>라벨</th>
                            <th>값</th>
                            <th className="text-right">작업</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tokenMenuItems.map((item, idx) => (
                            <SortableTokenMenuItem
                              key={item.order}
                              item={item}
                              index={idx}
                              editingItem={editingItem}
                              editItemData={editItemData}
                              setEditItemData={setEditItemData}
                              handleStartEditItem={handleStartEditItem}
                              handleCancelEditItem={handleCancelEditItem}
                              handleSaveEditItem={handleSaveEditItem}
                              handleDeleteTokenMenuItem={handleDeleteTokenMenuItem}
                              univId={univId}
                            />
                          ))}
                        </tbody>
                      </table>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
