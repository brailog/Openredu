/*
var mychat = buildChat({
    key : 'XXX',
    channel : '123',
    timeout : '123',
    endPoint : 'httto' });
*/

// Utilizando pjax
$("a:not([data-remote])").pjax("#content", { timeout: null });

// Constrói um novo objeto Chat
var buildChat = function(opts){
  var pusher;
  var config = { "endPoint" : '/presence/auth', "log" : false };
  var $listTitle = $("<div/>", { "class" : "title" }).text("Chat");
  var $userList = $("<div/>", { id : "chat-list" }).append($listTitle).append("<ul/>");
  $listTitle.after($("<div/>", { "class" : "minimize" }).text("Minimizar"));
  var $barTitle = $("<span/>", { "class" : "count" }).text("Chat (0)");
  var $chatBar = $("<div/>", { id :'chat-bar', "class" : "opened" }).append($barTitle);
  var $windowList = $("<ul/>", { id : "chat-windows-list" });
  var getCSSUserId = function(userId) {
    return "chat-user-" + userId;
  };

  $("#chat-bar, .chat-window-bar").live("click", function(){
      $(this).prev().toggle();
      if ($(this).hasClass("opened")) {
        $(this).removeClass("opened").addClass("closed");
      } else {
        $(this).removeClass("closed").addClass("opened");
      }
      return false;
  });

  $("#chat-list li").live("click", function(){
      var thisId = $(this).attr("id");
      var $liWindow = $("#window-" + thisId );
      if ($liWindow.length != 0) {
        if ($liWindow.find(".chat-window-bar").hasClass("closed")) {
          $liWindow.find(".chat-window-bar").click();
        }
      } else {
        var userName = $(this).find('.name').text();
        var $winBarTitle = $("<span/>", { "class" : "name" }).text(userName);
        var $windowBar = $("<div/>", { "class" : "chat-window-bar opened"}).append($winBarTitle);
        var $window = $("<div/>", { "class" : "chat-window" }).append($('<span/>', { "class" : "name" }).text(userName));
        $window.append($('<ul/>', { "class" : "conversation" }));
        $window.append($('<div/>', { "class" : "user-input" }).append($('<input/>', { "type" : "text" })));

        $('#chat-windows-list').append($('<li/>', { "id" : "window-" + thisId }).append($window, $windowBar));
      }
      return false;
  });

  $(".minimize").live("click", function(){
      $(this).parent().toggle();
      $(this).removeClass("opened").addClass("closed");
  });

  $.fn.addContact = function(member){
    return this.each(function(){
        var $this = $(this);
        var $li = $("<li/>", { "class" : "clearfix" }).appendTo($this);
        $li.attr("id", getCSSUserId(member.id));
        $("<img/>", { "src" : member.info.thumbnail, "class" : "avatar" }).appendTo($li);
        $("<span/>", { 'class' : "name" }).text(member.info.name).appendTo($li);
        var $role = $("<div/>", { "class" : "roles" }).appendTo($li);
        $role.append($("<div/>", { "class" : "status"}).text("on-line"));

        // Adicionando classe p/ papeis true
        for(var key in member.info.roles){
          if(member.info.roles[key]){ $role.addClass(key); }
        }
    });
  };

  $.extend(config, opts);

  var that = {
    // Inicializa o pusher e mostra a barra de chat
    init : function(){
      // Initicializando layout
      $("body").append($userList, $chatBar, $windowList);
      Pusher.channel_auth_endpoint = config.endPoint;
      // Informações de log
      if(config.log){
        Pusher.log = function(message) {
          if (console && console.log) console.log(arguments);
        };
      }
      pusher = new Pusher(config.key);
    },
    // Inscreve no canal do usuário logado
    subscribeMyChannel : function(){
      myPresenceCh = pusher.subscribe(config.channel);

      // Escuta evento de confirmação de inscrição no canal
      myPresenceCh.bind("pusher:subscription_succeeded", function(members){
          members.each(function(member) {
              var channels = member.info.friends;
              // Somente o user atual tem info.friends
              if(channels){
                for(var i = 0; i < channels.length; i++) {
                  pusher.subscribe(channels[i].channel);
                }
              } else {
                // Para o restante dos membros do canal
                // (caso em que os contatos entram antes do dono, logo eles
                // devem ser adicionados a interface).
                that.uiAddContact(member);
              }
          });
      });

      // Escuta evento de adição de membro no canal
      myPresenceCh.bind("pusher:member_added", function(member){
        that.uiAddContact(member);
        pusher.subscribe(member.info.channel);
      });

      // Escuta evento de remoção de membro no canal
      myPresenceCh.bind("pusher:member_removed", function(member){
        that.uiRemoveContact(member.id);
        pusher.unsubscribe(member.info.channel);
      });
    },
    // Increve no canal dado (Caso de já estar no chat e aceitar convite de contato)
    subscribeNewContact : function(channel){
      pusher.subscribe(channel);
    },
    // Desinscreve do canal dado
    unsubscribeContact : function(channel){
      pusher.unsubscribe(channel);
    },
    // Adiciona a lista de contatos
    uiAddContact : function(member){
      $userList.find("ul").addContact(member);
      that.uiUpdateCounter();
    },
    // Remove da lista de contatos
    uiRemoveContact : function(userId){
      $("#" + getCSSUserId(userId)).remove();
      that.uiUpdateCounter();
    },
    uiUpdateCounter : function(){
      var count = $userList.find('li').length;
      $chatBar.find('.count').text("Chat ("+ count +")");
    }
  };

  return that;
}

