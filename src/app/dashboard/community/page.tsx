'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type User, type CommunityPost, type Company } from '@/lib/supabase';

interface PostWithCompany extends CommunityPost {
  company?: Company;
}

export default function CommunityPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<PostWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadCommunity();
  }, []);

  const loadCommunity = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/auth/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (userData) {
        setUser(userData);

        if (userData.company_id) {
          const { data: postsData } = await supabase
            .from('community_posts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

          if (postsData && postsData.length > 0) {
            const companyIds = [...new Set(postsData.map(p => p.company_id))];
            const { data: companiesData } = await supabase
              .from('companies')
              .select('*')
              .in('id', companyIds);

            const companiesMap = new Map(companiesData?.map(c => [c.id, c]));

            const enrichedPosts = postsData.map(p => ({
              ...p,
              company: companiesMap.get(p.company_id)
            }));
            setPosts(enrichedPosts);
          }
        }
      }
    } catch (error) {
      console.error('Error loading community:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !user?.company_id) return;

    setPosting(true);
    try {
      const { error } = await supabase
        .from('community_posts')
        .insert({
          company_id: user.company_id,
          content: newPost.trim()
        });

      if (error) throw error;
      setNewPost('');
      loadCommunity();
    } catch (error) {
      console.error('Error posting:', error);
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading community...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <Link href="/" className="nav-logo">AutoresQ<span>Rental</span></Link>
          <div className="nav-links">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/dashboard/fleet">Fleet</Link>
            <Link href="/dashboard/rentals">Rentals</Link>
            <Link href="/dashboard/claims">Claims</Link>
            <Link href="/dashboard/community" className="active">Community</Link>
          </div>
          <div className="nav-user">
            <span>{user?.first_name} {user?.last_name}</span>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="page-header">
          <div className="header-left">
            <Link href="/dashboard" className="back-link">← Back to Dashboard</Link>
            <h1>Community</h1>
            <p>Connect with other rental companies</p>
          </div>
        </div>

        <div className="community-grid">
          <div className="community-main">
            <div className="post-composer">
              <form onSubmit={handlePost}>
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share something with the community..."
                  rows={3}
                />
                <div className="composer-actions">
                  <button type="submit" className="btn-submit" disabled={posting || !newPost.trim()}>
                    {posting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            </div>

            <div className="posts-feed">
              {posts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <h3>No posts yet</h3>
                  <p>Be the first to share with the community</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="post-card">
                    <div className="post-header">
                      <div className="post-company">
                        <div className="company-avatar">
                          {post.company?.name?.charAt(0) || 'C'}
                        </div>
                        <div className="company-info">
                          <span className="company-name">{post.company?.name || 'Company'}</span>
                          {post.company?.verified && <span className="verified-badge">✓</span>}
                        </div>
                      </div>
                      <span className="post-date">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="post-content">
                      <p>{post.content}</p>
                    </div>
                    <div className="post-actions">
                      <button className="action-btn">👍 Like</button>
                      <button className="action-btn">💬 Comment</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="community-sidebar">
            <div className="sidebar-card">
              <h3>Community Guidelines</h3>
              <ul>
                <li>Be respectful to other members</li>
                <li>No spam or promotional content</li>
                <li>Share relevant industry insights</li>
                <li>Help fellow rental companies</li>
              </ul>
            </div>

            <div className="sidebar-card">
              <h3>Member Companies</h3>
              <div className="member-list">
                <div className="member-item">
                  <div className="member-avatar">A</div>
                  <span>AutoRent Pro</span>
                </div>
                <div className="member-item">
                  <div className="member-avatar">P</div>
                  <span>Premium Motors</span>
                </div>
                <div className="member-item">
                  <div className="member-avatar">F</div>
                  <span>FastTrack rentals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
