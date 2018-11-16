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
    user = new User(
      localStorage.getItem('username'),
      '',
      localStorage.getItem('token')
    );
    $('p.display-user').text(user.username);
  }

  StoryList.getStories(function(globalStoryList) {
    // run getStories class method from api classes
    // this takes a cb and uses on the new story object
    //
    for (let story of globalStoryList.stories) {
      appendStoryElement(story.title, story.url);
    }
  });

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
      $loginForm.slideToggle();
    });
  });

  $newForm.on('submit', addStory);

  $stories.on('click', 'small', filterByHost);

  $stories.on('click', '.far, .fas', toggleFavorite);

  $favorites.on('click', filterByFavoriteOrShowAll);

  function addStory(e) {
    e.preventDefault();

    let title = $title.val();
    let url = $url.val();
    appendStoryElement(title, url);

    $submit.trigger('click');
  }

  function appendStoryElement(title, url) {
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

    $stories.append($newStory);
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
    $(e.target).toggleClass('far fas');
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
});
