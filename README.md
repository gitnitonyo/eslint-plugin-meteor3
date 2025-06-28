# eslint-plugin-meteor3

ESLint plugin for enforcing Meteor 3 API best practices and coding standards.

## Overview

This plugin helps ensure your codebase follows Meteor 3 best practices by enforcing:
- Use of async methods over synchronous methods
- Proper async/await usage with Meteor 3 APIs
- Proper error handling with async operations
- Use of Meteor.Error instead of generic Error
- Async Meteor method declarations
- Avoidance of deprecated Meteor methods

## Installation

```bash
npm install eslint-plugin-meteor3 --save-dev
```

## Usage

Add `meteor3` to the plugins section of your `.eslintrc` configuration file:

```json
{
  "plugins": ["meteor3"]
}
```

Then configure the rules you want to use under the rules section:

```json
{
  "rules": {
    "meteor3/prefer-async-methods": "warn",
    "meteor3/use-async-await": "warn",
    "meteor3/no-sync-methods-server": "warn",
    "meteor3/async-meteor-methods": "warn",
    "meteor3/proper-error-handling": "warn",
    "meteor3/use-meteor-error": "warn",
    "meteor3/no-deprecated-methods": "error"
  }
}
```

Alternatively, you can use one of the provided configurations:

```json
{
  "extends": ["plugin:meteor3/recommended"]
}
```

Or for stricter enforcement:

```json
{
  "extends": ["plugin:meteor3/strict"]
}
```

## Rules

### prefer-async-methods

Enforces the use of async methods over their synchronous counterparts.

```js
// ❌ Bad
Meteor.call('method', arg, (err, res) => {});
Posts.insert({ title: 'New Post' });

// ✅ Good
await Meteor.callAsync('method', arg);
await Posts.insertAsync({ title: 'New Post' });
```

### use-async-await

Enforces the use of async/await syntax with Meteor 3 async methods instead of callbacks or promise chains.

```js
// ❌ Bad
Meteor.callAsync('method', arg).then(result => {});
Meteor.callAsync('method', arg, (err, res) => {});

// ✅ Good
const result = await Meteor.callAsync('method', arg);
```

### no-sync-methods-server

Prevents using synchronous methods on the server, which can block the event loop.

```js
// ❌ Bad (on server)
const user = Meteor.user();
const post = Posts.findOne({ _id });

// ✅ Good
const user = await Meteor.userAsync();
const post = await Posts.findOneAsync({ _id });
```

### async-meteor-methods

Enforces declaring Meteor methods as async functions.

```js
// ❌ Bad
Meteor.methods({
  'posts.insert'(post) {
    // method implementation
  }
});

// ✅ Good
Meteor.methods({
  async 'posts.insert'(post) {
    // method implementation
  }
});
```

### proper-error-handling

Enforces proper error handling for async operations using try/catch blocks.

```js
// ❌ Bad
async function updatePost(postId, data) {
  await Posts.updateAsync({ _id: postId }, { $set: data });
}

// ✅ Good
async function updatePost(postId, data) {
  try {
    await Posts.updateAsync({ _id: postId }, { $set: data });
  } catch (error) {
    console.error('Failed to update post:', error);
    throw new Meteor.Error('update-failed', 'Failed to update post');
  }
}
```

### use-meteor-error

Enforces using Meteor.Error instead of generic Error in Meteor methods for better client handling.

```js
// ❌ Bad
Meteor.methods({
  async 'posts.insert'(post) {
    if (!this.userId) {
      throw new Error('Not authorized');
    }
    // method implementation
  }
});

// ✅ Good
Meteor.methods({
  async 'posts.insert'(post) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create a post');
    }
    // method implementation
  }
});
```

### no-deprecated-methods

Prevents using methods that are deprecated in Meteor 3.

```js
// ❌ Bad
Meteor.wrapAsync(asyncFunction);
Meteor.publish('posts', function() {});
Email.send({ to, subject, text });

// ✅ Good
// Use native Promise or util.promisify instead of wrapAsync
Meteor.publishAsync('posts', async function() {});
await Email.sendAsync({ to, subject, text });
```

## License

MIT
