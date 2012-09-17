/*
 * The view manager handle the context switching between all views.
 */

/**
 * Change active state according to the hash
 * TODO : bind to pop state.
 */
function changeState(target, options){
	console.log("changing to state : "+target+" - "+options);

	if (target == "splash"){
		window.history.pushState("Splash", "SlideZ", "/");
		document.body.setAttribute("data-state", "splash");
		
	}else if (target == "home"){
		window.history.pushState("Home", "SlideZ", "/")
		document.body.setAttribute("data-state", "home");
		openMain();
	
	}else if(target == "overview"){
		window.history.pushState("Overview", "SlideZ", "/")
		document.body.setAttribute("data-state", "home");
		openOverview(options.presentation_id);
	
	}
}


/**
 * Changing state and entering the overview mode of a presentation
 */
function openOverview(presentation_id){
	// download the presentation content
	var httpRequest = new XMLHttpRequest();
	
	httpRequest.onreadystatechange = function(){
		// state 4 means that we have the full response.
		if (httpRequest.readyState === 4) {
			if (httpRequest.status === 200) {
				// Here we have the presentation.
				var sandbox = document.getElementById("app-sandbox");
				sandbox.innerHTML = httpRequest.responseText;
				var list = sandbox.querySelectorAll(
											"app-sandbox section[data-slide]");
				//changeTitle(sandbox.querySelectorAll(
											"app-sandbox title")[0].innerHTML);
				//createGrid(list, presentationAdapter, sectionCreator);
			}else if (httpRequest.status === 500) {
				console.error("Something went wrong on the server.");
			}else {
				console.error("Got strange response : %s", httpRequest.status);
			}
		}
	}
	
	httpRequest.open("GET", "/presentation/"+presentation_id);
	httpRequest.send();
}


/**
 * changing state and entering the main state
 * We fecth all presentation available for the user and display them
 */
function openMain(){
	changeTitle("Open a presentation");
	
	// fetch the list of presentations from the server.
	var httpRequest = new XMLHttpRequest();
	
	httpRequest.onreadystatechange = function(){
		// state 4 means that we have the full response.
		if (httpRequest.readyState === 4) {
			if (httpRequest.status === 200) {
				// Here we have the list.
				var list = JSON.parse(httpRequest.responseText);
				// TODO : create something prettier than this ugly '+'
				list.splice(0, 0, {firstSlide:"+"});
				createGrid(list, presentationListAdapter, iframeCreator);
			}else if (httpRequest.status === 403) {
				// user is not logged in
				document.location.hash = "#splash";
			}else if (httpRequest.status === 500) {
				console.error("Something went wrong on the server.");
			}else {
				console.error("Got strange response : %s", httpRequest.status);
			}
		}
	}
	
	httpRequest.open("GET", "/list/presentations");
	httpRequest.send();
}


/**
 * Change the window title
 */
function changeTitle(newTitle){
	document.querySelector("#app-header>h1").textContent=newTitle;
	document.title = newTitle + " - SlideZ";
}


/**
 * Adapt presentation data to be used by a elmtCreator.
 */
function presentationListAdapter(presentation){
	if (presentation.id){
		targetState = {
			state : "overview",
			options : {
				presentation_id : presentation.id
			}
		}
	}else{
		targetState = "/new/presentation";
		targetState = {state : "new"}
	}
	return {
		stylesheet : presentation.template,
		content : presentation.firstSlide,
		targetState : targetState
	};
}


/**
 * Display all the presentation contained in list
 */
function createGrid(list, dataAdapter, elmtCreator){
	var container = document.getElementById("app-grid");
	container.innerHTML = "";
	
	for (var i=0, elmt; elmt = list[i]; i++){
		elmtCreator(container, dataAdapter(elmt));
	}
}


/**
 * Create an iframe element inside node and fill it with elmt
 */
function iframeCreator(node, elmt){
	var iframe = document.createElement("iframe");
	node.appendChild(iframe);
	
	var data = "";
	data += "<link 	rel='stylesheet'";
	data += "		href='"+elmt.stylesheet+"'";
	data += "		type='text/css'";
	data += "		media='screen'/>";
	data += "<section data-slide='unknown'>";
	data += 		elmt.content;
	data += "</section>";
	
	iframe.src = "data:text/html;charset=utf-8,"+escape(data);
	
	iframe.contentWindow.addEventListener("click", function(){
		changeState(elmt.targetState.state, elmt.targetState.options);
	});
}
