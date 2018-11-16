const BASE_URL = 'https://hack-or-snooze-v2.herokuapp.com';
let storyList;
let user;

// function login(username, password) {
//   $.post(`${BASE_URL}/login`, { user: { username, password } }, storeToken);
// }

// function storeToken(response) {
//   localStorage.setItem('token', response.token);
// }

// function getToken() {
//   let token = localStorage.getItem('token');
//   if (token) {
//     return token;
//   } else {
//     alert('Please login first.');
//     return new Error('No token found, login first');
//   }
// }

class StoryList {
  constructor(stories) {
    this.stories = stories;
    this.addStory = this.addStory.bind(this);
  }

  static getStories(probablyDOMStuff) {
    // fetch stories from API
    $.getJSON(`${BASE_URL}/stories`, function(response) {
      const stories = response.stories.map(function(story) {
        return new Story(story);
      });
      storyList = new StoryList(stories);
      return probablyDOMStuff(storyList);
    });
  }

  addStory(user, protoStoryObj, probablyDOMStuff) {
    $.post(
      `${BASE_URL}/stories`,
      { token: user.loginToken, story: protoStoryObj },
      response => {
        let newStory = new Story(response.story);
        this.stories.unshift(newStory);
        // callback for retrieveDetails is unclear
        user.retrieveDetails(() => probablyDOMStuff(newStory));
      }
    );
  }

  removeStory(user, storyId, probablyDOMStuff) {
    $.ajax({
      url: `${BASE_URL}/stories/${storyId}`,
      type: 'DELETE',
      data: {
        token: user.loginToken,
        success: () => {
          let storyListIndex = this.stories.findIndex(
            story => story.storyId === storyId
          );
          this.stories.splice(storyListIndex, 1);
          storyListIndex = user.ownStories.findIndex(
            story => story.storyId === storyId
          );
          user.ownStories.splice(storyListIndex, 1);
          // prompt indicates that response will be an updated list of stories.
          // May need to call other methods on it
          probablyDOMStuff(this);
        }
      }
    });
  }
}

class User {
  constructor(username, name, token) {
    (this.username = username),
      (this.name = name),
      (this.loginToken = token),
      (this.favorites = []),
      (this.ownStories = []),
      (this.createdAt = ''); //assigned when creating or retrieveDetails
    this.updatedAt = ''; //assigned when creating or retrieveDetails
  }

  //probablyDOMStuff should update global user
  static create(username, password, name, probablyDOMStuff) {
    $.post(
      `${BASE_URL}/signup`,
      { user: { username, password, name } },
      function(response) {
        user = new User(
          response.user.username,
          response.user.name,
          response.token
        );
        localStorage.setItem('username', response.user.username);
        localStorage.setItem('token', response.token);
        user.createdAt = response.user.createdAt;
        user.updatedAt = response.user.updatedAt;
        // solution and prompt differ. Solution returns the new user object
        probablyDOMStuff(response);
      }
    );
  }

  // probablyDOMStuff function should update user's login token and global user variable
  static login(username, password, probablyDOMStuff) {
    console.log(`just starting login`);
    $.post(`${BASE_URL}/login`, { user: { username, password } }, response => {
      user = new User(
        response.user.username,
        response.user.name,
        response.token
      );
      console.log(`in User.login`);
      localStorage.setItem('username', response.user.username);
      localStorage.setItem('token', response.token);
      user.createdAt = response.user.createdAt;
      user.updatedAt = response.user.updatedAt;
      // solution and prompt differ. Solution returns the user object
      probablyDOMStuff(response);
    });
  }

  static stayLoggedIn(probablyDOMStuff) {
    // if (localStorage.getItem("token")) {
    user = new User(
      localStorage.getItem('username'),
      '', // Will get filled when retrieveDetails is called
      localStorage.getItem('token')
    );
    user.retrieveDetails(probablyDOMStuff);
  }

  retrieveDetails(probablyDOMStuff) {
    $.get(
      `${BASE_URL}/users/${this.username}`,
      { token: this.loginToken },
      response => {
        this.favorites = response.user.favorites.map(
          favorite => new Story(favorite)
        );
        this.ownStories = response.user.stories.map(story => new Story(story));
        this.name = response.user.name;
        this.createdAt = response.user.createdAt;
        this.updatedAt = response.user.updatedAt;

        probablyDOMStuff(this);
      }
    );
  }

  addFavorite(storyId, probablyDOMStuff) {
    $.post(
      `${BASE_URL}/users/${user.username}/favorites/${storyId}`,
      { token: this.loginToken },
      () => {
        this.retrieveDetails(() => probablyDOMStuff(this));
      }
    );
  }

  removeFavorite(storyId, probablyDOMStuff) {
    $.ajax({
      url: `${BASE_URL}/users/${user.username}/favorites/${storyId}`,
      type: 'DELETE',
      data: {
        token: this.loginToken,
        success: () => {
          this.retrieveDetails(() => probablyDOMStuff(this));
        }
      }
    });
  }

  update(userData, probablyDOMStuff) {
    const { username, favorites, ...userDetails } = userData;
    $.ajax({
      url: `${BASE_URL}/users/${this.username}`,
      type: 'PATCH',
      data: {
        token: localStorage.getItem('token'),
        user: userDetails,
        success: () => {
          this.name = response.user.name;
          this.password = userDetails.password || this.password;
          probablyDOMStuff(this);
        }
      }
    });
  }

  remove(probablyDOMStuff) {
    $.ajax({
      url: `${BASE_URL}/users/${this.username}`,
      type: 'DELETE',
      data: { token: this.loginToken, success: probablyDOMStuff }
    });
  }
}

class Story {
  constructor(storyDetails) {
    (this.author = storyDetails.author),
      (this.title = storyDetails.title),
      (this.url = storyDetails.url),
      (this.username = storyDetails.username),
      (this.storyId = storyDetails.storyId);
  }

  update(user, storyData, probablyDOMStuff) {
    const { storyId, ...storyDetails } = storyData;
    $.ajax({
      url: `${BASE_URL}/stories/${storyId}`,
      type: 'PATCH',
      data: {
        token: user.loginToken,
        story: storyDetails,
        success: response => {
          this.author = response.story.author;
          this.title = response.story.title;
          this.url = response.story.url;
          probablyDOMStuff(this);
        }
      }
    });
  }
}
