function launchModal(){
    modalTriggerElement = document.querySelector(".htp-trigger");
    modalElement = document.querySelector(".modal");
    closeModalElement = document.querySelector(".close-button");

    modalTriggerElement.addEventListener('click', toggleModal);
    closeModalElement.addEventListener('click', toggleModal);
    closeModalElement.addEventListener('keydown', (event) => {
        if(event.key == "Enter"){
            toggleModal();
        }
    });
    window.addEventListener('click', windowOnClick);
    toggleModal();
}

function toggleModal(){
    modalElement.classList.toggle("show-modal");
}

function windowOnClick(event) {
    if (event.target === modalElement) {
        toggleModal();
    }
}
