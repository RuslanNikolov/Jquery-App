function startApp() {
    setGreeting();
    const baseUrl = 'https://baas.kinvey.com/';
    const appKey = 'kid_rJOXg5NPW';
    const appSecret = '3b3b2731bf5e43d6b6b813797c1d89ed';

    $(document).on({
        ajaxStart: function () {
            $("#loadingBox").show()
        },
        ajaxStop: function () {
            $("#loadingBox").hide()
        }
    });
    $('#linkHome').click(() => showView('home'));
    $('#linkLogin').click(() => showView('login'));
    $('#linkRegister').click(() => showView('register'));
    $('#linkListAds').click(() => showView('listAds'));
    $('#linkCreateAd').click(() => showView('createAd'));

    $('#buttonLoginUser').click(login);
    $('#buttonRegisterUser').click(register);
    $('#linkLogout').click(logout);
    $('#buttonCreateAd').click(createAd);

    function showView(name) {
        $('section').hide();
        switch (name) {
            case 'home':
                $('#viewHome').show();
                break;
            case 'login':
                $('#viewLogin').show();
                break;
            case 'register':
                $('#viewRegister').show();
                break;
            case 'listAds':
                getAds();
                $('#viewAds').show();
                break;
            case 'createAd':
                $('#viewCreateAd').show();
                break;
            case 'edit':
                $('#viewEditAd').show();
                break;

        }
    }
    function showInfo(message) {
            $('#infoBox').text(message).show();
            setTimeout(() => $('#infoBox').fadeOut(),3000);
        }
    function showError(message) {
            $('#errorBox').text(message).show();
            setTimeout(() => $('#errorBox').fadeOut(),5000)
        }
    function handleError(reason){
        $('#errorBox').text(reason.statusText).show();
        setTimeout(() => $('#errorBox').fadeOut(),5000)
    }
    function setGreeting(){
        let username = localStorage.getItem('username');
        if(username !== null){
            $('#loggedInUser').text(`Welcome, ${username}!`);
            $('#linkLogin').hide();
            $('#linkRegister').hide();
            $('#linkListAds').show();
            $('#linkCreateAd').show();
            $('#linkLogout').show();
        }
        else {
            $('#loggedInUser').text('');
            $('#linkHome').show();
            $('#linkLogin').show();
            $('#linkRegister').show();
            $('#linkListAds').hide();
            $('#linkCreateAd').hide();
            $('#linkLogout').hide();
        }
    }
    function setStorage(data){
        localStorage.setItem('authtoken',data._kmd.authtoken);
        localStorage.setItem('username',data.username);
        localStorage.setItem('userId',data._id);
        showView('home');
        setGreeting();
    }

    function login(e){
        e.preventDefault();
        let username = $('#viewLogin input[name="username"]').val();
        let password = $('#viewLogin input[name="passwd"]').val();
         $.ajax({
            url:baseUrl + 'user/' + appKey + '/login',
            method: "POST",
            headers: {
                'Authorization': 'Basic ' + btoa(appKey + ':' + appSecret),
                'Content-Type':'application/json'},
            data:JSON.stringify({
                username: username,
                password: password}),
            success:(data) => {
                setStorage(data);
                showInfo('Login successful'); },
            error: handleError
        });

    }
    function register(e){
        e.preventDefault();
        let username = $('#viewRegister input[name="username"]').val();
        let password = $('#viewRegister input[name="passwd"]').val();
        if(username.length === 0){
            showError('Username cannot be empty')
            return;
        }
        if(password.length === 0){
            showError('Password cannot be empty')
            return;
        }
        $.ajax({
            url:baseUrl + 'user/' + appKey,
            method: "POST",
            headers: {
                'Authorization': 'Basic ' + btoa(appKey + ':' + appSecret),
                'Content-Type':'application/json'},
            data:JSON.stringify({
                username: username,
                password: password}),
            success:(data) =>{
                setStorage(data);
                showInfo('Registration successful'); },
            error: handleError
        });
    }
    function logout(){
        $.ajax({
            url:baseUrl + 'user/' + appKey + '/_logout',
            method: "POST",
            headers: {
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken')},
            success:logoutSuccess,
            error: handleError
        });
        function logoutSuccess(data){
            localStorage.clear();
            setGreeting()
            showView('home');
        }
    }
    function createAd(){
        let title = $('#viewCreateAd input[name="title"]').val();
        let description = $('#viewCreateAd textarea[name="description"]').val();
        let image = $('#viewCreateAd input[name="image"]').val();
        let datePublished = $('#viewCreateAd input[name="datePublished"]').val();
        let price = $('#viewCreateAd input[name="price"]').val();

        if(title.length === 0){
            showError('Title cannot be empty');
            return;
        }
        if(image.length === 0){
            showError('Image url cannot be empty');
            return;
        }
        
        if(description.length === 0){
            showError('Description cannot be empty');
            return;
        }
        if(price.length === 0){
            showError('Price cannot be empty');
            return;
        }

        $.ajax({
            url:baseUrl + 'appdata/' + appKey + '/Ads',
            method:'POST',
            headers:{
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
                'Content-Type':'application/json'},
            data:JSON.stringify({
                title:title,
                image:image,
                description:description,
                publisher:localStorage.getItem('username'),
                datePublished:datePublished,
                price:price}),
            success:createSuccess,
            error:handleError
        });
        function createSuccess (){
            $('#viewCreateAd').find('form').trigger('reset');
            showView('listAds')
            showInfo('Ad created!')
        }

    }
    function getAds(){
        $.ajax({
            url:baseUrl + 'appdata/' + appKey + '/Ads',
            headers: {
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken')},
            success:displayAds,
            error: handleError
        });
        function displayAds(data){
            $('#viewAds').find('table').find('tbody').empty();
            if(data.length === 0)
            { $('#ads').text('No advertisements available')
            return;
            }
            $('#viewAds').find('table').append($(`<tr>
                    <th>Title</th>
                    <th>Image</th>
                    <th>Description</th>
                    <th>Publisher</th>
                    <th>Date Published</th>
                    
                  <th>Price</th>
                  <th>Actions</th>
                </tr>`))
            for (let ad of data){
                let actions = [];
                if(ad._acl.creator === localStorage.getItem('userId')){
                    actions.push($('<button>&#9998;</button>').click(()=>editAd(ad)));
                    actions.push($('<button>&#10006;</button>').click(()=>deleteAd(ad._id)))
                }
                let row = $('<tr>');
                row.append(`<td>${ad.title}</td>`);
                row.append(`<img src="${ad.image}" alt="image">`);
                row.append(`<td>${ad.description}</td>`);
                row.append(`<td>${ad.publisher}</td>`);
                row.append(`<td>${ad.datePublished}</td>`);
                row.append(`<td>${ad.price}</td>`);
                row.append($(`<td>`).append(actions));
              $('#viewAds').find('table').find('tbody').append(row);

            }
        }
    }
    function deleteAd(id){
        $.ajax({
            url:baseUrl + 'appdata/' + appKey + '/Ads/' + id,
            method:'DELETE',
            headers:{
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken')},
            success:deleteSuccess,
            error:handleError
        });
        function deleteSuccess(data){
            showInfo('Ad deleted!');
            showView('listAds')
        }

    }


        function editAd(ad){
            showView('edit');
            $('#viewEditAd input[name="title"]').val(ad.title);
            $('#viewEditAd input[name="image"]').val(ad.image);
            $('#viewEditAd textarea[name="description"]').val(ad.description);
            $('#viewEditAd input[name="datePublished"]').val(ad.datePublished);
            $('#viewEditAd input[name="price"]').val(ad.price);
            $('#buttonEditAd').click(edit);
            function edit(){

                let newAd = {
                   title: $('#viewEditAd input[name="title"]').val(),
                    image: $('#viewEditAd input[name="image"]').val(),
                description: $('#viewEditAd textarea[name="description"]').val(),
                    publisher:localStorage.getItem('username'),
                datePublished: $('#viewEditAd input[name="datePublished"]').val(),
                price: $('#viewEditAd input[name="price"]').val()
                };


                if(newAd.title.length === 0){
                   showError('Title cannot be empty')
                    return;
                }
                
                if(newAd.image.length === 0){
                   showError('Image cannot be empty')
                    return;
                }
                if(newAd.description.length === 0){
                    showError('Description cannot be empty')
                    return;
                }
                if(newAd.price.length === 0){
                    showError('Price cannot be empty')
                    return;
                }


                $.ajax({
                    url:baseUrl + 'appdata/' + appKey + '/Ads/' + ad._id,
                    method:'PUT',
                    headers:{
                        'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
                        'Content-Type':'application/json'},
                    data:JSON.stringify(newAd),
                    success:editSuccess,
                    error:handleError
                });
                function editSuccess(data){
                    showInfo('Ad edited!');
                    showView('listAds')
                }
            }

        }


}