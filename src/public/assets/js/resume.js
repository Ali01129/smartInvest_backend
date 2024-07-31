
$(document).ready(function () {
    $( ".accordion" ).click(function() {
	 if($(this).hasClass('active')){
		 
		 $(this).removeClass('active');
		 $(".panel").css("display","none");
		  $(".panel").css("visibility","hidden");
	 }
	 else{
		 $(this).addClass('active');
		 $(".panel").css("display","block");
		 	  $(".panel").css("visibility","visible");
	 }
	});
	 
});