-- Phase 2-3: 조직 관리 + 랩 협업 스키마

-- 알림
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 랩 멤버 (교수-학생 관계)
CREATE TABLE lab_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  supervisor_id UUID REFERENCES auth.users(id),
  student_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supervisor_id, student_id)
);

-- 프로젝트 공유 (학생 → 교수 공유)
CREATE TABLE project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES auth.users(id),
  shared_with UUID REFERENCES auth.users(id),
  can_comment BOOLEAN DEFAULT true,
  can_approve BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, shared_with)
);

-- 검토 요청
CREATE TABLE review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  canvas_version_id UUID REFERENCES canvas_versions(id),
  requested_by UUID REFERENCES auth.users(id),
  requested_to UUID REFERENCES auth.users(id),
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 코멘트
CREATE TABLE review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_request_id UUID REFERENCES review_requests(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  target_type TEXT NOT NULL,
  target_id TEXT,
  content TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 버전 승인
CREATE TABLE version_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_version_id UUID REFERENCES canvas_versions(id),
  approved_by UUID REFERENCES auth.users(id),
  review_request_id UUID REFERENCES review_requests(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_approvals ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "users can view own notifications"
  ON notifications FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "lab_members_access"
  ON lab_members FOR ALL
  USING (auth.uid() = supervisor_id OR auth.uid() = student_id);

CREATE POLICY "shared_project_access"
  ON project_shares FOR ALL
  USING (auth.uid() = shared_by OR auth.uid() = shared_with);

CREATE POLICY "review_requests_access"
  ON review_requests FOR ALL
  USING (auth.uid() = requested_by OR auth.uid() = requested_to);

CREATE POLICY "review_comments_access"
  ON review_comments FOR ALL
  USING (
    review_request_id IN (
      SELECT id FROM review_requests
      WHERE requested_by = auth.uid() OR requested_to = auth.uid()
    )
  );

CREATE POLICY "version_approvals_access"
  ON version_approvals FOR ALL
  USING (
    review_request_id IN (
      SELECT id FROM review_requests
      WHERE requested_by = auth.uid() OR requested_to = auth.uid()
    )
  );

-- 인덱스
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;
CREATE INDEX idx_lab_members_supervisor ON lab_members(supervisor_id);
CREATE INDEX idx_lab_members_student ON lab_members(student_id);
CREATE INDEX idx_project_shares_project ON project_shares(project_id);
CREATE INDEX idx_review_requests_project ON review_requests(project_id);
CREATE INDEX idx_review_comments_request ON review_comments(review_request_id);
