// Static comments
(function($) {
    $("#comment-form").submit(function() {
      var form = this;
  
      $(form).addClass("disabled");
      $("#comment-form-submit").html(
        '<svg class="icon spin"><use xlink:href="/assets/icons/icons.svg#icon-loading"></use></svg> Loading...'
      );
  
      $.ajax({
        type: $(this).attr("method"),
        url: $(this).attr("action"),
        data: $(this).serialize(),
        contentType: "application/x-www-form-urlencoded",
        success: function(data) {
          $("#comment-form-submit")
            .html("Submitted")
            .addClass("btn--disabled");
          $("#comment-form .js-notice")
            .removeClass("danger")
            .addClass("success");
          showAlert(
            '<strong>Thanks for your comment!</strong> It is currently pending and will show on the site once approved.'
          );
        },
        error: function(err) {
          console.log(err);
          $("#comment-form-submit").html("Submit Comment");
          $("#comment-form .js-notice")
            .removeClass("success")
            .addClass("danger");
          showAlert(
            "<strong>Sorry, there was an error with your submission.</strong> Please make sure all required fields have been completed and try again."
          );
          $(form).removeClass("disabled");
        }
      });
  
      return false;
    });
  
    function showAlert(message) {
      $("#comment-form .js-notice").removeClass("hidden");
      $("#comment-form .js-notice-text").html(message);
    }
  })(jQuery);
  
  // Staticman comment replies
  // modified from Wordpress https://core.svn.wordpress.org/trunk/wp-includes/js/comment-reply.js
  // Released under the GNU General Public License - https://wordpress.org/about/gpl/
  var addComment = {
    moveForm: function(commId, parentId, respondId, postId) {
      var div,
        element,
        style,
        cssHidden,
        t = this,
        comm = t.I(commId),
        respond = t.I(respondId),
        cancel = t.I("cancel-comment-reply-link"),
        parent = t.I("comment-replying-to"),
        post = t.I("comment-post-slug"),
        commentForm = respond.getElementsByTagName("form")[0];
  
      if (!comm || !respond || !cancel || !parent || !commentForm) {
        return;
      }
  
      t.respondId = respondId;
      postId = postId || false;
  
      if (!t.I("sm-temp-form-div")) {
        div = document.createElement("div");
        div.id = "sm-temp-form-div";
        div.style.display = "none";
        respond.parentNode.insertBefore(div, respond);
      }
  
      comm.parentNode.insertBefore(respond, comm.nextSibling);
      if (post && postId) {
        post.value = postId;
      }
      parent.value = parentId;
      cancel.style.display = "";
  
      cancel.onclick = function() {
        var t = addComment,
          temp = t.I("sm-temp-form-div"),
          respond = t.I(t.respondId);
  
        if (!temp || !respond) {
          return;
        }
  
        t.I("comment-replying-to").value = null;
        temp.parentNode.insertBefore(respond, temp);
        temp.parentNode.removeChild(temp);
        this.style.display = "none";
        this.onclick = null;
        return false;
      };
  
      /*
       * Set initial focus to the first form focusable element.
       * Try/catch used just to avoid errors in IE 7- which return visibility
       * 'inherit' when the visibility value is inherited from an ancestor.
       */
      try {
        for (var i = 0; i < commentForm.elements.length; i++) {
          element = commentForm.elements[i];
          cssHidden = false;
  
          // Modern browsers.
          if ("getComputedStyle" in window) {
            style = window.getComputedStyle(element);
            // IE 8.
          } else if (document.documentElement.currentStyle) {
            style = element.currentStyle;
          }
  
          /*
           * For display none, do the same thing jQuery does. For visibility,
           * check the element computed style since browsers are already doing
           * the job for us. In fact, the visibility computed style is the actual
           * computed value and already takes into account the element ancestors.
           */
          if (
            (element.offsetWidth <= 0 && element.offsetHeight <= 0) ||
            style.visibility === "hidden"
          ) {
            cssHidden = true;
          }
  
          // Skip form elements that are hidden or disabled.
          if ("hidden" === element.type || element.disabled || cssHidden) {
            continue;
          }
  
          element.focus();
          // Stop after the first focusable element.
          break;
        }
      } catch (er) {}
  
      return false;
    },
  
    I: function(id) {
      return document.getElementById(id);
    }
};