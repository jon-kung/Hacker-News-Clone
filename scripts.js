$(function() {
  const $submit = $("#submit");
  const $favorites = $("#favorites");
  const $newForm = $("#new-form");
  const $stories = $("#stories");
  const $title = $("#title");
  const $url = $("#url");
  const $clearFilter = $(".navbar-right");

  $submit.on("click", toggleForm);

  $newForm.on("submit", addStory);

  $stories.on("click", "small", filterByHost);

  $stories.on("click", ".far, .fas", toggleFavorite);

  $favorites.on("click", filterByFavoriteOrShowAll);



function toggleForm() {
  $newForm.slideToggle();
}

function addStory(e) {
  e.preventDefault();

  let title = $title.val();
  let url = $url.val();
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
  $submit.trigger("click");
  $title.val("");
  $url.val("");

  $stories.append($newStory);
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
  $(e.target).toggleClass("far fas");
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
