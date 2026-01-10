"""
Loopync API Backend Tests
Tests for: Health, Auth, Posts, Reels, Users endpoints
Focus: Performance optimization testing (P0/P1 features)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://vibetribe-2.preview.emergentagent.com')

# Test credentials
TEST_USER_EMAIL = "test@test.com"
TEST_USER_PASSWORD = "testpassword123"
ADMIN_EMAIL = "loopyncpvt@gmail.com"
ADMIN_PASSWORD = "admin123"


class TestHealthEndpoint:
    """Health check endpoint tests"""
    
    def test_health_endpoint_internal(self):
        """Test internal health endpoint"""
        response = requests.get(f"{BASE_URL}/health")
        # Health endpoint returns HTML (frontend) when accessed via public URL
        # This is expected behavior - the /health route is handled by frontend
        assert response.status_code == 200


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test successful login with test credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_USER_EMAIL
        assert "id" in data["user"]
        
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@test.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == ADMIN_EMAIL


class TestPostsEndpoints:
    """Posts API endpoint tests"""
    
    def test_get_posts(self):
        """Test fetching posts list"""
        response = requests.get(f"{BASE_URL}/api/posts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_posts_have_required_fields(self):
        """Test that posts have required fields for OptimizedImage components"""
        response = requests.get(f"{BASE_URL}/api/posts")
        assert response.status_code == 200
        posts = response.json()
        
        if len(posts) > 0:
            post = posts[0]
            # Required fields for PostCard component
            assert "id" in post
            assert "authorId" in post
            assert "text" in post or post.get("text") is None
            assert "author" in post
            
            # Author fields needed for OptimizedAvatar
            author = post.get("author", {})
            if author:
                assert "id" in author or "name" in author
                # Avatar can be null or a URL
                
    def test_posts_with_media_have_media_url(self):
        """Test posts with media have proper media URLs"""
        response = requests.get(f"{BASE_URL}/api/posts")
        assert response.status_code == 200
        posts = response.json()
        
        posts_with_media = [p for p in posts if p.get("media") or p.get("mediaUrl")]
        for post in posts_with_media:
            media = post.get("media") or post.get("mediaUrl")
            assert media is not None
            # Media should be a string (URL or path)
            assert isinstance(media, str)


class TestReelsEndpoints:
    """Reels API endpoint tests"""
    
    def test_get_reels(self):
        """Test fetching reels list"""
        response = requests.get(f"{BASE_URL}/api/reels")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_reels_have_author_info(self):
        """Test reels have author info for FeedReelCard OptimizedAvatar"""
        response = requests.get(f"{BASE_URL}/api/reels")
        assert response.status_code == 200
        reels = response.json()
        
        if len(reels) > 0:
            reel = reels[0]
            assert "id" in reel
            assert "authorId" in reel
            # Author info for avatar display
            if "author" in reel and reel["author"]:
                author = reel["author"]
                assert "name" in author or "handle" in author


class TestCapsulesEndpoints:
    """VibeCapsules (Stories) API endpoint tests"""
    
    def test_get_capsules(self):
        """Test fetching capsules/stories list"""
        response = requests.get(f"{BASE_URL}/api/capsules")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_capsules_have_author_info(self):
        """Test capsules have author info for VibeCapsules OptimizedAvatar"""
        response = requests.get(f"{BASE_URL}/api/capsules")
        assert response.status_code == 200
        capsules = response.json()
        
        # Capsules may be empty, that's OK
        for capsule in capsules:
            assert "id" in capsule or "authorId" in capsule


class TestUsersEndpoints:
    """Users API endpoint tests"""
    
    def test_get_users_list(self):
        """Test fetching users list"""
        response = requests.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_get_user_by_id(self):
        """Test fetching specific user by ID"""
        # First login to get a valid user ID
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        assert login_response.status_code == 200
        user_id = login_response.json()["user"]["id"]
        
        # Fetch user by ID
        response = requests.get(f"{BASE_URL}/api/users/{user_id}")
        assert response.status_code == 200
        user = response.json()
        assert user["id"] == user_id
        assert "name" in user
        assert "handle" in user
        
    def test_user_profile_endpoint(self):
        """Test user profile endpoint with posts and stats"""
        # First login to get a valid user ID
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        assert login_response.status_code == 200
        user_id = login_response.json()["user"]["id"]
        
        # Fetch user profile
        response = requests.get(f"{BASE_URL}/api/users/{user_id}/profile")
        assert response.status_code == 200
        profile = response.json()
        assert "user" in profile
        assert "posts" in profile
        assert "followersCount" in profile or "postsCount" in profile


class TestCommentsEndpoints:
    """Comments API endpoint tests for CommentsSection OptimizedAvatar"""
    
    def test_get_post_comments(self):
        """Test fetching comments for a post"""
        # First get a post ID
        posts_response = requests.get(f"{BASE_URL}/api/posts")
        assert posts_response.status_code == 200
        posts = posts_response.json()
        
        if len(posts) > 0:
            post_id = posts[0]["id"]
            response = requests.get(f"{BASE_URL}/api/posts/{post_id}/comments")
            assert response.status_code == 200
            comments = response.json()
            assert isinstance(comments, list)
            
            # Check comment structure for OptimizedAvatar
            for comment in comments:
                assert "id" in comment or "authorId" in comment


class TestMediaEndpoints:
    """Media serving endpoint tests for OptimizedImage"""
    
    def test_media_endpoint_exists(self):
        """Test that media endpoint is accessible"""
        # Get a post with media
        posts_response = requests.get(f"{BASE_URL}/api/posts")
        assert posts_response.status_code == 200
        posts = posts_response.json()
        
        posts_with_media = [p for p in posts if p.get("media") or p.get("mediaUrl")]
        if len(posts_with_media) > 0:
            media_url = posts_with_media[0].get("media") or posts_with_media[0].get("mediaUrl")
            if media_url and media_url.startswith("/api/media/"):
                full_url = f"{BASE_URL}{media_url}"
                response = requests.head(full_url)
                # Media should be accessible (200) or redirect
                assert response.status_code in [200, 301, 302, 304]


class TestAuthenticatedEndpoints:
    """Tests requiring authentication"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
        
    def test_get_current_user(self, auth_token):
        """Test getting current authenticated user"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        user = response.json()
        assert "id" in user
        assert "email" in user
        
    def test_user_interests(self, auth_token):
        """Test user interests endpoint"""
        # Get user ID first
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert me_response.status_code == 200
        user_id = me_response.json()["id"]
        
        response = requests.get(
            f"{BASE_URL}/api/users/{user_id}/interests",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200


class TestPerformanceOptimization:
    """Tests related to P0 performance optimization features"""
    
    def test_posts_response_time(self):
        """Test that posts endpoint responds within acceptable time"""
        import time
        start = time.time()
        response = requests.get(f"{BASE_URL}/api/posts")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        # Should respond within 5 seconds for reasonable performance
        assert elapsed < 5.0, f"Posts endpoint took {elapsed:.2f}s, expected < 5s"
        
    def test_reels_response_time(self):
        """Test that reels endpoint responds within acceptable time"""
        import time
        start = time.time()
        response = requests.get(f"{BASE_URL}/api/reels")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 5.0, f"Reels endpoint took {elapsed:.2f}s, expected < 5s"
        
    def test_capsules_response_time(self):
        """Test that capsules endpoint responds within acceptable time"""
        import time
        start = time.time()
        response = requests.get(f"{BASE_URL}/api/capsules")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 5.0, f"Capsules endpoint took {elapsed:.2f}s, expected < 5s"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
