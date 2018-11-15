const BASE_URL = "https://hack-or-snooze-v2.herokuapp.com";
let storyList;
let user;

function login(username, password) {
  $.post(`${BASE_URL}/login`, { user: { username, password } }, storeToken);
}

function storeToken(response) {
  localStorage.setItem("token", response.token);
}

function getToken() {
  let token = localStorage.getItem("token");
  if (token) {
    return token;
  } else {
    alert("Please login first.");
    return new Error("No token found, login first");
  }
}

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  // probablyDOMStuff should update global storyList variable
  static getStories(probablyDOMStuff) {
    // fetch stories from API
    $.getJSON(`${BASE_URL}/stories`, function(response) {
      const stories = response.stories.map(function(story) {
        return new Story(
          story.author,
          story.title,
          story.url,
          story.username,
          story.storyId
        );
      });
      const newStoryList = new StoryList(stories);
      return probablyDOMStuff(newStoryList);
    });
  }

  addStory(user, protoStoryObj, probablyDOMStuff) {
    $.post(
      `${BASE_URL}/stories`,
      { token: user.loginToken, story: protoStoryObj },
      function(response) {
        // callback for retrieveDetails is unclear
        user.retrieveDetails(unclearCallback);
        // prompt indicates that response will be an updated list of stories.
        // May need to call other methods on it
        probablyDOMStuff(response);
      }
    );
  }

  removeStory(storyId, probablyDOMStuff) {
    $.ajax(
      {
        url: `${BASE_URL}/stories/${storyId}`,
        type: "DELETE",
        data: { token: localStorage.getItem("token") }
      },
      response => {
        // prompt indicates that response will be an updated list of stories.
        // May need to call other methods on it
        probablyDOMStuff(response);
      }
    );
  }
}

class User {
  constructor(username, password, name) {
    (this.username = username),
      (this.password = password),
      (this.name = name),
      (this.loginToken = ""),
      (this.favorites = []),
      (this.ownStories = []),
      (this.login = this.login.bind(this)),
      (this.updateUserAndToken = this.updateUserAndToken.bind(this)),
      (this.retrieveDetails = this.retrieveDetails.bind(this));
  }

  //probablyDOMStuff should update global user
  static create(username, password, name, probablyDOMStuff) {
    $.post(
      `${BASE_URL}/signup`,
      { user: { username, password, name } },
      function(response) {
        user = new User(response.user.username, password, response.user.name);
        console.log(user);
        probablyDOMStuff(response);
      }
    );
  }

  // probablyDOMStuff function should update user's login token and global user variable
  login(probablyDOMStuff) {
    $.post(
      `${BASE_URL}/login`,
      { user: { username: this.username, password: this.password } },
      response => {
        this.loginToken = response.token;
        probablyDOMStuff(response);
      });
  }

  addFavorite(storyId, probablyDOMStuff) {
    $.post(
      `${BASE_URL}/users/${user.username}/favorites/${storyId}`,
      { token: this.loginToken },
      response => {
        // Callback is unclear
        this.retrieveDetails(unclearCallback);
        // Callback contents unclear. Assume favorites due to method name
        probablyDOMStuff(response.user.favorites);
      }
    );
  }

  removeFavorite(storyId, probablyDOMStuff) {
    $.ajax(
      {
        url: `${BASE_URL}/users/${user.username}/favorites/${storyId}`,
        type: "DELETE",
        data: { token: localStorage.getItem("token") }
      },
      response => {
        // Callback is unclear
        // once we get update the database with the delete
        // we need to update client favorites
        this.retrieveDetails(unclearCallback);
        // Callback contents unclear. Assume favorites due to method name
        probablyDOMStuff(this.favorites);
      }
    );
  }

  retrieveDetails(probablyDOMStuff) {
    $.get(`${BASE_URL}/users/${this.username}`, response => {
      this.favorites = response.user.favorites.map(favorite => new Story(favorite));
      this.ownStories = response.user.stories.map(story => new Story(story));
      console.log(this.favorites);
      probablyDOMStuff(this);
    });
  }

  update(userData, probablyDOMStuff){
      const { username, favorites, ...userDetails} = userData
      $.ajax (
      {url: `${BASE_URL}/users/${this.username}`,
      type: "PATCH",
      data: { token: localStorage.getItem("token") , user : userDetails }
      }, response => {
        this.name = userDetails.name || this.name; 
        this.password = userDetails.password || this.password;
        probablyDOMStuff(this);
      });
  }

  remove(probablyDOMStuff){
    $.ajax (
      {url: `${BASE_URL}/users/${this.username}`,
      type: "DELETE",
      data: { token: localStorage.getItem("token")}
      }, response => {
        probablyDOMStuff(response);
      });
  }


  // might need to remove this : 
  updateUserAndToken(response) {
    this.loginToken = response.token;
    localStorage.setItem("token", response.token);
    localStorage.setItem("user", JSON.stringify(this));
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
  
  update(user, storyData, probablyDOMStuff){
    const { storyId, ...storyDetails} = storyData
    $.ajax (
      {url: `${BASE_URL}/stories/${storyId}`,
      type: "PATCH",
      data: { token: localStorage.getItem("token")
      story: storyDetails}  
    }, response => {
      const updatedStory = new Story(response.story);
      let indexOfStory = storyList.stories.findIndex((item) => item.storyId === storyId);
      storyList.stories.splice(indexOfStory, 1, updatedStory);
      indexOfStory = user.ownStories.findIndex((item) => item.storyId === storyId);
      user.ownStories.splice(indexOfStory, 1, updatedStory);
      probablyDOMStuff(response.story);
    });
  }
}