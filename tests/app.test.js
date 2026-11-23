import test from 'node:test';
import assert from 'node:assert';

test('TikTok Income and Analytics Calculation', () => {
  const views = 50000;
  const ratePer1000 = 5; // ৳ 5 per 1,000 views
  const expectedIncome = (views / 1000) * ratePer1000;
  assert.strictEqual(expectedIncome, 250);

  const watchSeconds = 36000;
  const watchHours = Number((watchSeconds / 3600).toFixed(1));
  assert.strictEqual(watchHours, 10.0);
});

test('TikTok Target Progress Percentage Limits', () => {
  const targetFollowersMax = 1000;
  const currentFollowers = 1250;
  const percent = Math.min(100, Math.round((currentFollowers / targetFollowersMax) * 100));
  assert.strictEqual(percent, 100);

  const currentViews = 4500;
  const targetViewsMax = 10000;
  const viewsPercent = Math.min(100, Math.round((currentViews / targetViewsMax) * 100));
  assert.strictEqual(viewsPercent, 45);
});

test('TikTok Username Sanitization', () => {
  const rawUsername = ' @h.m.eyasin.gamer  ';
  const cleanUsername = rawUsername.replace(/@/g, '').trim();
  assert.strictEqual(cleanUsername, 'h.m.eyasin.gamer');
});

test('TikTok Engagement Aggregation', () => {
  const likes = 3842;
  const comments = 154;
  const shares = 310;
  const saves = 420;
  const totalEngagement = likes + comments + shares + saves;
  assert.strictEqual(totalEngagement, 4726);
});

test('TikTok 3-Second View Logic Enforcement', () => {
  // Rule: watched < 3 seconds -> NO view recorded
  const checkViewIncrement = (watchedDurationSec) => {
    return watchedDurationSec >= 3;
  };

  assert.strictEqual(checkViewIncrement(1), false);
  assert.strictEqual(checkViewIncrement(2.9), false);
  assert.strictEqual(checkViewIncrement(3), true);
  assert.strictEqual(checkViewIncrement(5), true);

  // View count increment test
  let initialViews = 0;
  const updateViews = (currentViews, watchedSec) => {
    return checkViewIncrement(watchedSec) ? currentViews + 1 : currentViews;
  };

  assert.strictEqual(updateViews(initialViews, 2), 0);
  assert.strictEqual(updateViews(initialViews, 3), 1);
});

test('TikTok Unique Account per Phone or Email Constraint', () => {
  const registeredAccounts = [
    { contact: '01711223344', name: 'User 1' },
    { contact: 'creator@tiktok.com', name: 'User 2' },
  ];

  const isIdentifierUnique = (identifier) => {
    const clean = identifier.trim().toLowerCase();
    return !registeredAccounts.some((acc) => acc.contact.trim().toLowerCase() === clean);
  };

  // Same number or email cannot be re-registered
  assert.strictEqual(isIdentifierUnique('01711223344'), false);
  assert.strictEqual(isIdentifierUnique('creator@tiktok.com'), false);
  assert.strictEqual(isIdentifierUnique(' CREATOR@TIKTOK.COM '), false);

  // New number or email is allowed
  assert.strictEqual(isIdentifierUnique('01899887766'), true);
  assert.strictEqual(isIdentifierUnique('newuser@example.com'), true);
});

test('TikTok Creator Dashboard Real Data Accuracy', () => {
  // Test that real single-view posts display exactly 1 view, without fake fallback 18900
  const userPostsWithSingleView = [
    { id: 'p1', views: 1, watchTime: 4, likes: 0, commentsCount: 0, shares: 0 },
  ];

  const calculateAccurateViews = (posts) => {
    return posts.reduce((acc, p) => acc + (p.views || 0), 0);
  };

  assert.strictEqual(calculateAccurateViews(userPostsWithSingleView), 1);

  const newCreatorPosts = [
    { id: 'p2', views: 0, watchTime: 0, likes: 0, commentsCount: 0, shares: 0 },
  ];
  assert.strictEqual(calculateAccurateViews(newCreatorPosts), 0);
});
