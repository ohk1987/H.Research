"use client"

interface CommentBadgeProps {
  count: number
  onClick?: () => void
}

// 캔버스 노드/엣지에 표시되는 코멘트 수 뱃지
export default function CommentBadge({ count, onClick }: CommentBadgeProps) {
  if (count <= 0) return null

  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute -right-2 -top-2 z-10 flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm transition-transform hover:scale-110"
      title={`코멘트 ${count}개`}
    >
      {count > 9 ? '9+' : count}
    </button>
  )
}
