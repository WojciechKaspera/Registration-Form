
$(document).ready(function () {
  var buttonNext = $(".btn-next");
  var buttonPrev = $(".btn-prev");
  var menuItems = $(".menuItem");
  var textForm = $("#others");
  var selectList = $("select");
  //nazwy sekcji w tabeli, indexy mają te same co kolejne sekcje
  var sectionNames = ["#?dane", "#?doswiadczenie", "#?warsztaty", "#?regulamin"];
  //obiekt w którym przechowuję wszystkie dane
  var formInputs = {};
  //tabela w której przechowuję informacje o tym, które sekcje są nadal disabled (na wypadek sytuacji, w której ktoś sobie wkleja linka od razu do "warsztatów" np.)
  var disabledSections = ["", "#?doswiadczenie", "#?warsztaty", "#?regulamin"];


  //jeżeli formData istnieje już w localStorage, to go pobieram i dopasowuję do obiektu z danymi (ten if jest potrzebny tylko przy pierwszym odpaleniu strony)
  if (localStorage.getItem("formData")) {
    formInputs = JSON.parse(localStorage.getItem("formData"));
  }

  //pobieram, jeżeli istnieje "disabled" z pamięci, w którym siedzi informacja, które elementy menu mają być disabled. Następnie na podstawie disabledSections disabluje odpowiednie elementy menu.
  $(menuItems).each(function (index) {
    if (localStorage.getItem("disabled")) {
      disabledSections = JSON.parse(localStorage.getItem("disabled"));
    }
    if (disabledSections[index] != "") {
      $(this).addClass("disable");
    }
  })

  //dla każdego inputa pobieram wartość jaką powinien mieć z formInputs i odpowiednio zmieniam.
  $("input").each(function () {
    if ($(this).attr("type") == "checkbox") {
      if (formInputs[$(this).attr("name")]) {
        $(this).prop('checked', true);
      }
    }
    else {
      if (formInputs[$(this).attr("name")]) {
        $(this).val(formInputs[$(this).attr("name")]);
      }
    }
  });

  //zabezpieczam się przed sytuacją, w której ktoś sobie wkleja linka do sekcji, która jest disabled - w przypadku, gdy tak jest, wywala użytkownika do sekcji początkowej
  if ((disabledSections.indexOf("#" + window.location.href.split(['#'])[1]) == -1)) {
    router();
  }
  else {
    window.location.assign('#?dane');
    router();
  }

  //funkcja do zmiany wartości konkretnego elementu w obiekcie z danymi (formInputs)
  function updateFormInputs(data) {
    if ($(data).attr("type") == "checkbox") {
      formInputs[$(data).attr("name")] = $(data).is(':checked');
    }
    else {
      formInputs[$(data).attr("name")] = $(data).val();
    }
  }

  //event handler odpalany za każdym razem jak któryś input traci focus - zapisuję zmianę wartości tego inputa w formInputs oraz wrzuca go od razu do localStorage
  $("input").on("blur", function () {
    updateFormInputs($(this));
    localStorage.setItem("formData", JSON.stringify(formInputs));
  });

  //event handler do klikania w elementy menu. Jeżeli disabled, to nic się nie dzieje. Jeżeli nie, to do targetSection przypisana jest sekcja o tym samym indeksie co indeks elementu menu (bo mają te same indeksy odpowiadające sobie skecje i elementy menu)
  $(menuItems).on("click", function (event) {
    event.preventDefault();
    if (!$(this).hasClass("disable")) {
      var currentSection = $("section.active");
      var targetSection = $("section")[$(this).parent().index()];
      //jeżeli przejdzie walidację, to zmienia URL na URL odpowiadający sekcji na którą zmieniamy i routerem tam ciśnie.
      if (validate(currentSection)) {
        var targetSectionIndex = $(this).parent().index();
        window.location.replace(sectionNames[targetSectionIndex]);
        $(menuItems[$(targetSection).index()]).addClass("active");
        $(menuItems[$(currentSection).index()]).removeClass("active");
        router();
      }
    }
  });

  //next i prev buttony działają tak jak kliknięcie na element menu, tylko prościej - zmienia na następną lub poprzednią sekcję
  $(buttonNext).on("click", function () {
    var currentSection = $("section.active");
    var targetSection = $("section.active").next();
    if (validate(currentSection)) {
      var nextSectionIndex = $("section.active").next().index();
      window.location.replace(sectionNames[nextSectionIndex]);
      $(menuItems[$(targetSection).index()]).removeClass("disable");
      disabledSections[$(targetSection).index()] = "";
      localStorage.setItem("disabled", JSON.stringify(disabledSections));
      $(menuItems[$(targetSection).index()]).addClass("active");
      $(menuItems[$(currentSection).index()]).removeClass("active");
      router();
    }
  });

  $(buttonPrev).on("click", function () {
    var currentSection = $("section.active");
    var targetSection = $("section.active").prev();
    if (validate(currentSection)) {
      var prevSectionIndex = $("section.active").prev().index();
      window.location.replace(sectionNames[prevSectionIndex]);
      $(menuItems[$(targetSection).index()]).removeClass("disable");
      disabledSections[$(targetSection).index()] = "";
      localStorage.setItem("disabled", JSON.stringify(disabledSections));
      $(menuItems[$(targetSection).index()]).addClass("active");
      $(menuItems[$(currentSection).index()]).removeClass("active");
      router();
    }
  });

  function validate(currentSection) {
    //ustawiłem sobie własny validateReturn, od którego zależy jak się funkcja skończy
    var validateReturn = true;
    //biorę inputy tylko z aktualnej sekcji
    var inputs = $(currentSection).find("input");
    $(inputs).each(function () {
      if ($(this).data("validate") == "require") {
        if ($(this).val() == "" && $(this).attr('type') != 'checkbox') {
          validateReturn = false;
          errorBar("To pole jest wymagane!", this);
        }
        //osobny jest dla checkboxów, bo one nie mają wartości tekstowej, która nas interesuje, tylko boolean czy jest zazanczony czy nie
        if ($(this).attr('type') == 'checkbox') {
          if (!$(this).prop('checked')) {
            validateReturn = false;
            $("label[for='iDontWannaLearn']").addClass('error-label');
          }
          else {
            validateReturn = true;
          }
        }
        if ($(this).attr('id') == "birhday") {
          if (!validateBirthday($(this).val())) {
            errorBar("Niepoprawny format!", this);
            validateReturn = false;
          }
        }
        if ($(this).attr('id') == "phone") {
          if (!validatePhone($(this).val())) {
            errorBar("Niepoprawny format!", this);
            validateReturn = false;
          }
        }
      }
    });
    return validateReturn;
  }

  //nie tworze nowego obiektu new date itd. bo on i tak mi nie sprawdzi, czy 29 luty 2017 istnieje, więc liczę tu na to, ze użytkownik nie ma downa i wpisze sensowną datę
  function validateBirthday(birthday) {
    var re = new RegExp("^([0-2]{1}[0-9]{1}|^[3]{1}[0-1]{1})-{1}([0]{1}[0-9]{1}|[1]{1}[0-2]{1})-{1}([1]{1}[9]{1}[0-9]{1}[0-9]{1}|[2]{1}[0]{1}[0-1]{1}[0-7]{1})$");
    if (re.exec(birthday) == null) {
      return false;
    }
    else {
      return true;
    }
  }

  function validatePhone(phone) {
    var re = new RegExp("^[0-9]{1}[0-9]{1}[0-9]{1} {1}-{1} {1}[0-9]{1}[0-9]{1}[0-9]{1} {1}-{1} {1}[0-9]{1}[0-9]{1}[0-9]{1}$");
    if (re.exec(phone) == null) {
      return false;
    }
    else {
      return true;
    }
  }

  //zapewne niepotrzebnie zjadający pamięć event handler, który zdejmuje errora z inputa, jeżeli coś mu wklepiemy
  $("input").on("keyup", function () {
    if($(this).val() != "") {
      errorBarRemover(this);
    }
  });

  //liczenie znaków w tym inpucie w sekcji "doświadczenie"
  $(textForm).on("keyup", function () {
    var charCount = $(textForm).val().length;
    $("#counterSpan").text(charCount + "/40");
    if (charCount == 40) {
      //zapalanie się licznika na czerwono, jak się dojdzie do 40
      $("#counterSpan").addClass("error-label");
    }
    else {
      $("#counterSpan").removeClass("error-label");
    }
  });

  //disabluje listę opcji do wyboru godziny warsztatów, w momencie zaznaczenia, że się na nie nie idzie
  $("#iDontWannaLearn").change("click", function () {
    if ($("#iDontWannaLearn").prop('checked')) {
      $(selectList).prop('disabled', 'disabled');
    }
    else {
      $(selectList).prop('disabled', '');
    }
    $("label[for='iDontWannaLearn']").removeClass('error-label');
  });

  $(selectList).change("click", function () {
    $("#iDontWannaLearn").prop('checked', false);
    //Jeżeli nie jest wybrana żadna opcja, to checbox musi być required.
    if ($(selectList).children().filter(":selected").filter(":eq(0)").text() == "Wybierz godzinę" && $(selectList).children().filter(":selected").filter(":eq(1)").text() == "Wybierz godzinę") {
      // OPCJONALNE $("#iDontWannaLearn").prop('checked', true);
      $("#iDontWannaLearn").data("validate", "require");
    }
    else {
      if ($("#iDontWannaLearn").data("validate") == "require") {
        $("#iDontWannaLearn").data("validate", "");
      }
    }
    $("label[for='iDontWannaLearn']").removeClass('error-label');
  });

  function switchFormPage(currentSection, targetSection) {
    if (validate(currentSection)) {
      $(currentSection).removeClass("active");
      $(targetSection).addClass("active");
      $(menuItems[$(targetSection).index()]).addClass("active");
      $(menuItems[$(currentSection).index()]).removeClass("active");
      $(menuItems[$(targetSection).index()]).removeClass("disable");
    }
  }

  $("#checkboxReg").change("click", function () {
    $(".richtext").removeClass('error-label');
  });

  $("#btnRegister").on("click", function () {
    if ($("#checkboxReg").prop('checked')) {
      var shouldIRegister = true;
      $("section").each(function (index) {
        //wywala do sekcji w której jest coś nie tak
        if (!validate($("section").eq(index))) {
          window.location.assign(sectionNames[index]);
          router();
          shouldIRegister = false;
        }
      });
      if (shouldIRegister) {
        register();
      }
    }
    else {
      $(".richtext").addClass('error-label');
      alert("Przed rejestracją zapoznaj się z regulaminem!");
    }
  });

  //dałem tę funkcje osobno w razie, gdyby to miało w przyszłości obsługiwać coś więcej niż informowanie, że jest git
  function register() {
    alert("zarejestrowałeś się fest!");
  }

  //jak validate wykryje coś zmaszczonego, to wyskakuje okienko
  function errorBar(message, that) {
    if (!$(that).parent().find(".error-div").length) {
      var messageHtml = $("<div class='error-div'>" + message + "</div>");
      $("#" + that.id).before(messageHtml);
    }
  }

  function errorBarRemover(that) {
    $("#" + that.id).prev(".error-div").remove();
  }

  function router() {
    //obczajam której sekcji przypada aktualny adres URL (nazwy sekcji w sectionNames mają takie same indeksy jak sekcje)
    var sectionIndex = sectionNames.indexOf('#' + window.location.href.split(['#'])[1]);
    if (sectionIndex != -1) {
      //waliduje wszystkie poprzednie sekcje, żeby się zabezpieczyć przed przypadkiem, w którymś ktoś sobie wklepał linka do którejś z sekcji nie mając dobrze wypełnionej wcześniejszej
      for (var i = 0; i < sectionIndex; i++) {
        if (!validate($("section").eq(i))) {
          //wywala użytkownika do sekcji, która nie przeszła walidacji
          window.location.replace(sectionNames[i]);
          $(menuItems).removeClass("active");
          $(menuItems).eq(i).addClass("active");
          $("section").removeClass('active');
          $("section").eq(i).addClass('active');
          return;
        }
      }
      $(menuItems).removeClass("active");
      $(menuItems).eq(sectionIndex).addClass("active");
      $("section").removeClass('active');
      $("section").eq(sectionIndex).addClass('active');
    }
    //w wypadku, jak coś jest nie tak jak trzeba i aktualny adres nie przynależy do niczego, to wywala do pierwszej strony
    else {
      window.location.assign('#?dane');
      router();
    }
  }
});
