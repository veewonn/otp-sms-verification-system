// Function to fetch the user's IP address
async function getUserIpAddress() {
  try {
    const response = await fetch("https://ipinfo.io/json");
    const data = await response.json();
    return data.ip || "";
  } catch (error) {
    console.error("Error fetching IP address:", error);
    return "";
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  // Initialize variable index
  var userIpAddress = await getUserIpAddress();
  let index = 0;
  const resetProcessLink = document.querySelector('[element="reset_process"]');
  resetProcessLink.style.display = "none";
  const MAX_OTP_ATTEMPTS = 3;
  let otpAttempts = 0;
  var element1 = document.getElementById("try-free-remaining-quota-text");
  var storedAttempts = localStorage.getItem(`otpAttempts_${userIpAddress}`);
  otpAttempts = storedAttempts ? parseInt(storedAttempts, 10) : 0;
  element1.innerText = `${MAX_OTP_ATTEMPTS - otpAttempts}/${MAX_OTP_ATTEMPTS}`;
  // let totalSeconds;
  const countdownTimerElement = document.querySelector(
    '[element="expiring_time_counter"]'
  );
  function updateCountdown() {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    countdownTimerElement.textContent = `${minutes}:${
      seconds < 10 ? "0" : ""
    }${seconds}`;
  }
  function startCountdown() {
    totalSeconds = 60;
    let startTime = Date.now(); // Record the start time

    const countdownInterval = setInterval(function () {
      const elapsedTime = Date.now() - startTime; // Calculate elapsed time
      //   console.log("Total seconds", totalSeconds);

      if (totalSeconds === 0) {
        clearInterval(countdownInterval);
        resetProcessLink.style.display = "block";
      } else {
        // Adjust totalSeconds based on elapsed time
        const adjustedSeconds = Math.floor(elapsedTime / 1000);
        totalSeconds = Math.max(0, 60 - adjustedSeconds);

        resetProcessLink.style.display = "none";
        updateCountdown();
      }
    }, 1000); // Update the countdown every 1000 milliseconds (1 second)
  }

  // Function to toggle display based on the index
  function toggleFormDisplay() {
    const formContainer = document.querySelector('[element="form_container"]');
    const formWrappers = formContainer.querySelectorAll(
      '[element="form_wrapper"]'
    );

    formWrappers.forEach((wrapper, i) => {
      const blocks = wrapper.querySelectorAll('[element="form_block"]');
      blocks.forEach((block) => {
        if (i === index) {
          block.classList.add("current");
        } else {
          block.classList.remove("current");
        }
      });

      // Add or remove ".is-current-step" class on form_wrapper
      if (i === index) {
        wrapper.classList.add("is-current-step");
      } else {
        wrapper.classList.remove("is-current-step");
      }
    });
  }

  // Add .is-current-step class to the first form_wrapper on page load
  toggleFormDisplay();
  // Event listener for "Send OTP Form" submission
  const sendOTPForm = document.querySelector('[form-name="send_otp"]');
  sendOTPForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    event.stopPropagation();
    // userIpAddress = await getUserIpAddress();

    storedAttempts = localStorage.getItem(`otpAttempts_${userIpAddress}`);
    otpAttempts = storedAttempts ? parseInt(storedAttempts, 10) : 0;
    // console.log("otpAttempts", otpAttempts);
    if (otpAttempts < MAX_OTP_ATTEMPTS) {
      const formData = new FormData(sendOTPForm);
      const mobileNumber = formData.get("mobileNumber");
      const countryCode = formData.get("countryCode");
      var radioButtons = document.querySelectorAll('input[name="OTP-Length"]');
      let otpLength = 0;
      for (var i = 0; i < radioButtons.length; i++) {
        if (radioButtons[i].checked) {
          otpLength = radioButtons[i].value;
        }
      }

      // Get user's IP address
      try {
        // Construct the API endpoint URL
        const apiEndpoint = `https://cpaas.messagecentral.com/verification/v1/external/sendOtp?mobileNumber=${mobileNumber}&countryCode=${countryCode}&flowType=SMS&id=${userIpAddress}&otpLength=${otpLength}`;

        // Perform the API request
        fetch(apiEndpoint, {
          method: "GET", // or 'GET' depending on your API endpoint requirements
          headers: {
            "Content-Type": "application/json", // adjust the content type based on your API requirements
            // Include any additional headers if needed
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            // console.log("API Response:", data);
            if (data.responseCode === 200) {
              otpAttempts++;
              startCountdown();
              var element1 = document.getElementById(
                "try-free-remaining-quota-text"
              );
              element1.innerText = `${
                MAX_OTP_ATTEMPTS - otpAttempts
              }/${MAX_OTP_ATTEMPTS}`;
              localStorage.setItem(
                `otpAttempts_${userIpAddress}`,
                otpAttempts.toString()
              );
              var element2 = document.querySelector(
                '[element="send-otp-img-done"]'
              );
              element2.style.display = "block";
              index++;
              var phoneNumberSpan = document.getElementById(
                "otp-validation-phone-number"
              );
              if (phoneNumberSpan) {
                phoneNumberSpan.textContent = `[ ${data.data.mobileNumber} ]`;
              }

              //   console.log("Index after Send OTP Form submission:", index);
              toggleFormDisplay();
              const submitOTPForm = document.querySelector(
                '[form-name="submit_otp"]'
              );
              submitOTPForm.addEventListener("submit", function (event) {
                event.preventDefault();
                event.stopPropagation();
                const enteredOTP = document.querySelector(
                  '[name="OTP-Number"]'
                ).value;
                try {
                  const apiEndpoint = `https://cpaas.messagecentral.com/verification/v1/external/validateOtp?countryCode=${countryCode}&mobileNumber=${data.data.mobileNumber}&verificationId=${data.data.verificationId}&code=${enteredOTP}&id=${userIpAddress}`;
                  fetch(apiEndpoint, {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                    },
                  })
                    .then((response) => {
                      if (!response.ok) {
                        throw new Error(
                          `HTTP error! Status: ${response.status}`
                        );
                      }
                      return response.json();
                    })
                    .then((data) => {
                      //   console.log("API Response:", data);
                      if (
                        data.verificationStatus === "VERIFICATION_COMPLETED"
                      ) {
                        index++;
                        var element3 = document.querySelector(
                          '[element="validate-otp-img-done"]'
                        );
                        element3.style.display = "block";
                        var element4 = document.querySelector(
                          '[element="success-overall-img-done"]'
                        );
                        element4.style.display = "block";
                        // console.log(
                        //   "Index after Submit OTP Form submission:",
                        //   index
                        // );
                        toggleFormDisplay();
                      } else {
                        const customErrorMessageWrapper =
                          document.querySelector(
                            '[element="custom-error-message-wrapper"]'
                          );
                        const customErrorMessageElement =
                          document.querySelector(
                            '[element="custom-error-message"]'
                          );
                        if (customErrorMessageWrapper) {
                          customErrorMessageWrapper.style.display = "block";
                        }
                        if (customErrorMessageElement) {
                          customErrorMessageElement.textContent =
                            data.errorMessage;
                        }

                        console.log(`${data.errorMessage}`);
                      }
                    })
                    .catch((error) => {
                      console.error("Error during API request:", error);
                    });
                } catch (error) {
                  console.error("Error getting user IP address:", error);
                }
              });
            } else {
              const customErrorMessageWrapper1 = document.querySelector(
                '[element="custom-error-message-wrapper-step1"]'
              );
              const customErrorMessageElement1 = document.querySelector(
                '[element="custom-error-message-step1"]'
              );
              if (customErrorMessageWrapper1) {
                customErrorMessageWrapper1.style.display = "block";
              }
              if (customErrorMessageElement1) {
                customErrorMessageElement1.textContent = data.data.errorMessage;
              }
              console.log(`${data.data.errorMessage}`);
            }
          })
          .catch((error) => {
            console.error("Error during API request:", error);
          });
      } catch (error) {
        console.error("Error getting user IP address:", error);
      }
    } else {
      console.log("Exceeded maximum OTP attempts.");
    }
  });

  const tryAgainLink = document.querySelector('[element="try_again"]');
  tryAgainLink.addEventListener("click", function (event) {
    event.preventDefault();
    var element3 = document.querySelector('[element="validate-otp-img-done"]');
    element3.style.display = "none";
    var element4 = document.querySelector(
      '[element="success-overall-img-done"]'
    );
    element4.style.display = "none";
    var element2 = document.querySelector('[element="send-otp-img-done"]');
    element2.style.display = "none";
    const submitOTPForm = document.querySelector('[form-name="submit_otp"]');
    submitOTPForm.reset();

    const customErrorMessageWrapper = document.querySelector(
      '[element="custom-error-message-wrapper"]'
    );
    const customErrorMessageElement = document.querySelector(
      '[element="custom-error-message"]'
    );
    if (customErrorMessageWrapper) {
      customErrorMessageWrapper.style.display = "none";
    }
    const customErrorMessageWrapper1 = document.querySelector(
      '[element="custom-error-message-wrapper-step1"]'
    );
    const customErrorMessageElement1 = document.querySelector(
      '[element="custom-error-message-step1"]'
    );
    if (customErrorMessageWrapper1) {
      customErrorMessageWrapper1.style.display = "none";
    }
    index = 0;
    totalSeconds = 0;
    toggleFormDisplay();
    // Additional logic if needed
  });
  if (resetProcessLink) {
    resetProcessLink.addEventListener("click", function (event) {
      event.preventDefault();
      console.log("Reset process link clicked");
      var element2 = document.querySelector('[element="send-otp-img-done"]');
      element2.style.display = "none";
      const submitOTPForm = document.querySelector('[form-name="submit_otp"]');
      submitOTPForm.reset();
      totalSeconds = 0;
      // clearInterval(countdownInterval);
      const customErrorMessageWrapper = document.querySelector(
        '[element="custom-error-message-wrapper"]'
      );
      const customErrorMessageElement = document.querySelector(
        '[element="custom-error-message"]'
      );
      if (customErrorMessageWrapper) {
        customErrorMessageWrapper.style.display = "none";
      }
      const customErrorMessageWrapper1 = document.querySelector(
        '[element="custom-error-message-wrapper-step1"]'
      );
      const customErrorMessageElement1 = document.querySelector(
        '[element="custom-error-message-step1"]'
      );
      if (customErrorMessageWrapper1) {
        customErrorMessageWrapper1.style.display = "none";
      }
      index = 0;
      //   console.log("Index after try_again click:", index);
      toggleFormDisplay();
    });
  } else {
    console.error(
      "Element with attribute 'element=\"reset_process\"' not found."
    );
  }
});
