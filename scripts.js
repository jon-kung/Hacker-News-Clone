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
  const $menuProfile = $('#menu-profile');
  const $profileForm = $('#profile-form');
  let fetchingStories = false;

  $(window).on('scroll', () => {
    if (
      $(window).scrollTop() >
      $(document).height() - $(window).height() - 100
    ) {
      let limit = 25;
      let skip = storyList.stories.length;

      if (!fetchingStories) {
        fetchingStories = true;
        storyList.getMoreStories(skip, limit, storyList => {
          if (user) {
            populateUserStories(storyList.stories.slice(skip));
          } else {
            populateAnonStoryList(storyList.stories.slice(skip));
          }
          fetchingStories = false;
        });
      }
    }
  });

  if (localStorage.getItem('token')) {
    User.stayLoggedIn(user => {
      initializeUserStoryList();
      updateDisplayedUserInfo();
    });
  } else {
    initializeAnonymousStoryList();
  }

  $submit.click(function() {
    $newForm.slideToggle();
  });

  $menuLogin.click(function() {
    if ($menuLogin.text() === 'Logout') {
      localStorage.clear();
      location.reload();
    }
    $loginForm.slideToggle();
  });

  $menuSignup.click(function() {
    $signupForm.slideToggle();
  });

  $menuProfile.click(function() {
    $profileForm.slideToggle();
  });

  $signupForm.on('submit', function(e) {
    e.preventDefault();
    let username = $('#signup-username').val();
    let password = $('#signup-password').val();
    let name = $('#signup-name').val();
    User.create(username, password, name, function(response) {
      updateDisplayedUserInfo();
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
    User.login(username, password, function(response) {
      updateDisplayedUserInfo();
      $('#login-form>form').trigger('reset');
      location.reload();
      $loginForm.slideToggle();
    });
  });

  $('#profile-password, #profile-password-confirm').on(
    'keyup',
    checkForPasswordMatch
  );

  $('#profile-form').on('submit', submitUserUpdate);

  $newForm.on('submit', addStory);

  $stories.on('click', 'small', filterByHost);

  $stories.on('click', '.fa-star', toggleFavorite);

  $stories.on('click', '.fa-trash-alt', removeOwnStory);

  $stories.on('click', '.fa-pencil-alt', revealEditMenu);

  $stories.on('click', '.update-submit', editStory);

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
      grantAccessToOwnStory($ownStoryElement);
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
    // reset new submission form
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

  function initializeUserStoryList() {
    StoryList.getStories(function(storyList) {
      let storyListArray = storyList.stories;
      populateUserStories(storyListArray);
    });
  }

  function populateUserStories(storiesArray) {
    let favoriteIds = new Set(user.favorites.map(story => story.storyId));
    let ownStoryIds = new Set(user.ownStories.map(story => story.storyId));
    for (let story of storiesArray) {
      let $element = attachStoryElement(story.title, story.url);
      if (favoriteIds.has(story.storyId)) {
        starPreviousFavorite($element);
      }
      if (ownStoryIds.has(story.storyId)) {
        grantAccessToOwnStory($element);
      }
    }
  }

  // When nobody is logged in
  function initializeAnonymousStoryList() {
    StoryList.getStories(function(storyList) {
      let storyListArray = storyList.stories;
      populateAnonStoryList(storyListArray);
    });
  }

  function populateAnonStoryList(storiesArray) {
    for (let story of storiesArray) {
      attachStoryElement(story.title, story.url);
    }
  }

  function starPreviousFavorite($element) {
    $element.children('span').toggleClass('far fas');
  }

  function grantAccessToOwnStory($element) {
    let ownButtons = $(`<div class = "d-inline float-right">`);
    let trashCan = $(`<span class="fas fa-trash-alt mr-2"></span>`);
    let editPencil = $(`<span class="fas fa-pencil-alt mr-2"></span>`);
    ownButtons.append(editPencil).append(trashCan);
    $element.append(ownButtons);
    $element.append(
      $(`<div class="update-form">
    <form class="form-horizontal">
      <div class="form-group row">
        <label for="title" class="pl-4 col-sm-1 form-label">title</label>
        <div class="col-sm-6">
          <input type="text" class="form-control update-title"
                 autocomplete="off">
        </div>
      </div>
      <div class="form-group row">
        <label for="url" class="pl-4 col-sm-1 form-label">url</label>
        <div class="col-sm-6">
          <input type="url" class="form-control update-url"
                 autocomplete="off">
        </div>
      </div>
      <div class="form-group">
        <div class="col-sm-offset-2 col-sm-10">
          <button type="submit" class="btn btn-primary update-submit">Update</button>
          <button type="submit" class="btn btn-secondary update-cancel">Cancel</button>
        </div>
      </div>
    </form>
  </div>`)
    );
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

  function updateDisplayedUserInfo() {
    $('p.display-user').text(`${user.name.split(' ')[0]} (${user.username})`);
    $('#profile-username').val(user.username);
    $('#profile-name').val(user.name);
    $('.p-created').text(user.createdAt);
    $('.p-updated').text(user.updatedAt);
    $menuLogin.text('Logout');
    $('#welcome-p').text('Welcome,');
  }

  function checkForPasswordMatch() {
    if ($('#profile-password').val() === $('#profile-password-confirm').val()) {
      if (
        !$('#profile-password, #profile-password-confirm').hasClass('is-valid')
      ) {
        $('#profile-password, #profile-password-confirm').toggleClass(
          'is-valid not-valid'
        );
      }
    } else {
      if (
        $('#profile-password, #profile-password-confirm').hasClass('is-valid')
      ) {
        $('#profile-password, #profile-password-confirm').toggleClass(
          'is-valid not-valid'
        );
      }
    }
  }

  function submitUserUpdate(e) {
    e.preventDefault();
    if ($('#profile-password').val() === $('#profile-password-confirm').val()) {
      let name = $('#profile-name').val();
      let password = $('#profile-password').val();
      if (!name && !password) {
        return;
      }
      let userDetails = {};
      if (name) {
        userDetails.name = name;
      }
      if (password) {
        userDetails.password = password;
      }
      $('#profile-form>form').trigger('reset');
      $profileForm.slideToggle();

      user.update(userDetails, updateDisplayedUserInfo);
      alert('Successfully updated information!');
    } else {
      alert('Passwords do not match.');
    }
  }

  // after the pencil has been clicked
  function revealEditMenu(e) {
    $(e.target)
      .parent()
      .next()
      .slideToggle();
  }

  // submit-update has been clicked
  function editStory(e) {
    e.preventDefault();
    let $form = $(e.target)
      .parent()
      .parent()
      .parent();
    let title = $form
      .children()
      .children()
      .children('input.update-title')
      .val();
    let url = $form
      .children()
      .children()
      .children('input.update-url')
      .val();
    let storyIndex = $form.parent().index();
    let story = storyList.stories[storyIndex];
    let storyData = { storyId: story.storyId };

    if (title) {
      storyData.title = title;
    }

    if (url) {
      storyData.url = url;
    }

    story.update(user, storyData, story => {
      $form.trigger('reset');
      $form.parent().slideToggle();
      $form
        .parent()
        .siblings('a')
        .text(story.title)
        .attr('href', story.url);
      $form
        .parent()
        .siblings('small')
        .text(`(${getShortLink(story.url)})`);
    });

    function getShortLink(url) {
      let shortLink = '';

      if (url.slice(0, 13).includes('www.')) {
        shortLink = url.slice(url.indexOf('.') + 1);
      } else {
        shortLink = url.slice(url.indexOf('//') + 2);
      }

      if (shortLink.indexOf('/') === -1) {
        return shortLink.slice(0);
      } else {
        return shortLink.slice(0, shortLink.indexOf('/'));
      }
    }
  }
});
