'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BookmarkState {
  /** 북마크된 공고 ID 목록 */
  bookmarkedIds: string[];
  /** 공고 북마크 추가 */
  addBookmark: (id: string) => void;
  /** 공고 북마크 제거 */
  removeBookmark: (id: string) => void;
  /** 북마크 토글 (있으면 제거, 없으면 추가) */
  toggleBookmark: (id: string) => void;
  /** 특정 공고가 북마크되어 있는지 확인 */
  isBookmarked: (id: string) => boolean;
  /** 전체 북마크 초기화 */
  clearBookmarks: () => void;
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarkedIds: [],

      addBookmark: (id) =>
        set((state) => ({
          bookmarkedIds: state.bookmarkedIds.includes(id)
            ? state.bookmarkedIds
            : [...state.bookmarkedIds, id],
        })),

      removeBookmark: (id) =>
        set((state) => ({
          bookmarkedIds: state.bookmarkedIds.filter((bookmarkId) => bookmarkId !== id),
        })),

      toggleBookmark: (id) => {
        const { isBookmarked, addBookmark, removeBookmark } = get();
        if (isBookmarked(id)) {
          removeBookmark(id);
        } else {
          addBookmark(id);
        }
      },

      isBookmarked: (id) => get().bookmarkedIds.includes(id),

      clearBookmarks: () => set({ bookmarkedIds: [] }),
    }),
    {
      name: 'bookmark-storage',
      // 북마크 ID 목록만 localStorage에 저장
      partialize: (state) => ({ bookmarkedIds: state.bookmarkedIds }),
    }
  )
);
