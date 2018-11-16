$(function() {
  const $submit = $("#submit");
  const $favorites = $("#favorites");
  const $newForm = $("#new-form");
  const $stories = $("#stories");
  const $title = $("#title");
  const $url = $("#url");
  const $clearFilter = $(".navbar-right");
  const $menuLogin = $("#menu-login");
  const $loginForm = $("#login-form");
  const $menuSignup = $("#menu-signup");
  const $signupForm = $("#signup-form");

  if (localStorage.getItem("token")) {
    user = new User(
      localStorage.getItem("username"),
      "", // Will get filled when retrieveDetails is called
      localStorage.getItem("token")
    );
    user.retrieveDetails(() => {
      StoryList.getStories(function(globalStoryList) {
        let favoriteIds = new Set(user.favorites.map(story => story.storyId));
        for (let i = globalStoryList.stories.length - 1; i >= 0; i--) {
          let story = globalStoryList.stories[i];
          prependStoryElement(story.title, story.url);
          if (favoriteIds.has(story.storyId)) {
            $(`ol li:first-child span`).toggleClass("far fas");
          }
        }
      });
      $("p.display-user").text(user.username);
    });
  }

  $submit.click(function() {
    $newForm.slideToggle();
  });

  $menuLogin.click(function() {
    $loginForm.slideToggle();
  });

  $menuSignup.click(function() {
    $signupForm.slideToggle();
  });

  $signupForm.on("submit", function(e) {
    e.preventDefault();
    let username = $("#signup-username").val();
    let password = $("#signup-password").val();
    let name = $("#signup-name").val();
    user = User.create(username, password, name, function(response) {
      $("p.display-user").text(response.user.username);
      $("#signup-form>form").trigger("reset");
      $signupForm.slideToggle();
    });
  });

  // Add a event listener on submit
  // cb should query for the values of Username/Password
  // and post to the api to log user in
  // update global user variable
  $loginForm.on("submit", function(e) {
    e.preventDefault();
    let username = $("#login-username").val();
    let password = $("#login-password").val();
    user = User.login(username, password, function(response) {
      $("p.display-user").text(response.user.username);
      $("#login-form>form").trigger("reset");
      $loginForm.slideToggle();
    });
  });

  $newForm.on("submit", addStory);

  $stories.on("click", "small", filterByHost);

  $stories.on("click", ".far, .fas", toggleFavorite);

  $favorites.on("click", filterByFavoriteOrShowAll);

  function addStory(e) {
    e.preventDefault();
    let title = $title.val();
    let url = $url.val();
    let author = user.name;
    storyList.addStory(user, { title, url, author }, newStory => {
      prependStoryElement(newStory.title, newStory.url);
      $submit.trigger("click");
    });
  }

  function prependStoryElement(title, url) {
    let $newLink = $("<a>", {
      text: ` ${title}`,
      href: url,
      target: "_blank"
    });

    // get short hostname: http://foo.bar.baz.com/page.html -> baz.com
    let hostname = $newLink
      .prop("hostname")
      .split(".")
      .slice(-2)
      .join(".");
    let $small = $("<small>", {
      text: `(${hostname})`
    });

    let $star = $("<span>", {
      class: "far fa-star"
    });

    let $newStory = $("<li>").append($star, $newLink, $small);
    $title.val("");
    $url.val("");

    $stories.prepend($newStory);
  }

  function filterByHost(e) {
    let currentHostname = $(e.target).text();
    $stories
      .children("li")
      .filter(function(i, el) {
        return (
          $(el)
            .children("small")
            .text() !== currentHostname
        );
      })
      .hide();

    $stories.addClass("hide-numbers");
    $clearFilter.show();
    $favorites.text("all");
  }

  function toggleFavorite(e) {
    let storyId = getStoryIdFromStarElement($(e.target));

    // not a favorite
    if ($(e.target).hasClass("far")) {
      user.addFavorite(storyId, () => $(e.target).toggleClass("far fas"));
    } else {
      user.removeFavorite(storyId, () => $(e.target).toggleClass("far fas"));
    }
  }

  function getStoryIdFromStarElement($starElement) {
    let $parent = $starElement.parent();
    let story = storyList.stories[$parent.index()];
    return story.storyId;
  }

  function filterByFavoriteOrShowAll(e) {
    if ($favorites.text() === "favorites") {
      $stories
        .children("li")
        .filter(function(i, el) {
          return $(el)
            .children(".fa-star")
            .hasClass("far");
        })
        .hide();
      $stories.addClass("hide-numbers");
      $favorites.text("all");
    } else {
      // show everything
      $stories.children("li").show();
      $stories.removeClass("hide-numbers");
      $favorites.text("favorites");
    }
  }
});
