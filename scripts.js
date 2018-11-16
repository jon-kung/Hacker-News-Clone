$(function() {
  const $submit = $('#submit');
  const $favorites = $('#favorites');
  const $newForm = $('#new-form');
  const $stories = $('#stories');
  const $title = $('#title');
  const $url = $('#url');
  const $clearFilter = $('.navbar-right');
  const $menuLogin = $('#menu-login');
  const $loginForm = $('#login-form');
  const $menuSignup = $('#menu-signup');
  const $signupForm = $('#signup-form');

  if (localStorage.getItem('token')) {
    User.stayLoggedIn(user => {
      populateStoryList();
      $('p.display-user').text(user.username);
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

  $signupForm.on('submit', function(e) {
    e.preventDefault();
    let username = $('#signup-username').val();
    let password = $('#signup-password').val();
    let name = $('#signup-name').val();
    user = User.create(username, password, name, function(response) {
      $('p.display-user').text(response.user.username);
      $('#signup-form>form').trigger('reset');
      $signupForm.slideToggle();
    });
  });

  // Add a event listener on submit
  // cb should query for the values of Username/Password
  // and post to the api to log user in
  // update global user variable
  $loginForm.on('submit', function(e) {
    e.preventDefault();
    let username = $('#login-username').val();
    let password = $('#login-password').val();
    user = User.login(username, password, function(response) {
      $('p.display-user').text(response.user.username);
      $('#login-form>form').trigger('reset');
      console.log(`pre-reload`);
      location.reload();
      console.log(`post-reload`);
      $loginForm.slideToggle();
    });
  });

  $newForm.on('submit', addStory);

  $stories.on('click', 'small', filterByHost);

  $stories.on('click', '.fa-star', toggleFavorite);

  $stories.on('click', '.fa-trash-alt', removeOwnStory);
  // $stories.on('click', '.fa-pencil-alt', editStory);

  $favorites.on('click', filterByFavoriteOrShowAll);

  function addStory(e) {
    e.preventDefault();
    let title = $title.val();
    let url = $url.val();
    let author = user.name;
    storyList.addStory(user, { title, url, author }, newStory => {
      let $ownStoryElement = attachStoryElement(
        newStory.title,
        newStory.url,
        'prepend'
      );
      grantAccessToOwnStories(newStory.storyId, $ownStoryElement);
      $submit.trigger('click');
    });
  }

  function attachStoryElement(title, url, prepend) {
    let $newLink = $('<a>', {
      text: ` ${title}`,
      href: url,
      target: '_blank'
    });
    // get short hostname: http://foo.bar.baz.com/page.html -> baz.com
    let hostname = $newLink
      .prop('hostname')
      .split('.')
      .slice(-2)
      .join('.');
    let $small = $('<small>', {
      text: `(${hostname})`
    });

    let $star = $('<span>', {
      class: 'far fa-star'
    });

    let $newStory = $('<li>').append($star, $newLink, $small);
    $title.val('');
    $url.val('');
    if (prepend) {
      $stories.prepend($newStory);
    } else {
      $stories.append($newStory);
    }
    return $newStory;
  }

  function filterByHost(e) {
    let currentHostname = $(e.target).text();
    $stories
      .children('li')
      .filter(function(i, el) {
        return (
          $(el)
            .children('small')
            .text() !== currentHostname
        );
      })
      .hide();

    $stories.addClass('hide-numbers');
    $clearFilter.show();
    $favorites.text('all');
  }

  function toggleFavorite(e) {
    let storyId = getStoryIdFromElement($(e.target));

    // not a favorite
    if ($(e.target).hasClass('far')) {
      user.addFavorite(storyId, () => $(e.target).toggleClass('far fas'));
    } else {
      user.removeFavorite(storyId, () => $(e.target).toggleClass('far fas'));
    }
  }

  function getStoryIdFromElement($element) {
    if ($element.parent().is('li')) {
      var $parent = $element.parent();
    } else {
      var $parent = $element.parent().parent();
    }
    let story = storyList.stories[$parent.index()];
    return story.storyId;
  }

  function filterByFavoriteOrShowAll(e) {
    if ($favorites.text() === 'favorites') {
      $stories
        .children('li')
        .filter(function(i, el) {
          return $(el)
            .children('.fa-star')
            .hasClass('far');
        })
        .hide();
      $stories.addClass('hide-numbers');
      $favorites.text('all');
    } else {
      // show everything
      $stories.children('li').show();
      $stories.removeClass('hide-numbers');
      $favorites.text('favorites');
    }
  }

  function populateStoryList() {
    StoryList.getStories(function(globalStoryList) {
      let favoriteIds = new Set(user.favorites.map(story => story.storyId));
      let ownStoryIds = new Set(user.ownStories.map(story => story.storyId));
      for (let story of globalStoryList.stories) {
        let $element = attachStoryElement(story.title, story.url);
        starPreviousFavorites(story.storyId, favoriteIds, $element);

        if (ownStoryIds.has(story.storyId)) {
          grantAccessToOwnStories(story.storyId, $element);
        }
      }
    });
  }

  function starPreviousFavorites(storyId, favoriteIds, $element) {
    if (favoriteIds.has(storyId)) {
      $element.children('span').toggleClass('far fas');
    }
  }

  function grantAccessToOwnStories(storyId, $element) {
    let ownButtons = $(`<div class = "d-inline float-right">`);
    let trashCan = $(`<span class="fas fa-trash-alt mr-2"></span>`);
    let editPencil = $(`<span class="fas fa-pencil-alt mr-2"></span>`);
    ownButtons.append(editPencil).append(trashCan);
    $element.append(ownButtons);
    // need to add a remove button to these ownStories
    // implement / add event liostener to removebutton
    // also add a edit button to this part
  }

  function removeOwnStory(e) {
    let storyName = $(e.target)
      .parent()
      .siblings('a')
      .text();
    if (confirm(`Are you sure you want to delete ${storyName}?`)) {
      let storyId = getStoryIdFromElement($(e.target));
      storyList.removeStory(user, storyId, () => {
        $(e.target)
          .parent()
          .parent()
          .remove();
      });
    }
  }
});

//  <div class = "d-inline float-right">
// <span class="far fa-trash-alt"></span>
// <span class="fas fa-pencil-alt"></span>
// </div>
