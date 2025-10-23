document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Replace or ensure the rendering logic uses the template and fills participants
  async function loadActivities() {
    const res = await fetch("/activities");
    const activities = await res.json();

    const list = document.getElementById("activities-list");
    list.innerHTML = "";

    const template = document.getElementById("activity-template");

    activities.forEach((activity) => {
      const node = template.content.cloneNode(true);
      node.querySelector(".activity-name").textContent = activity.name;
      node.querySelector(".activity-description").textContent = activity.description || "";
      node.querySelector(".activity-capacity").textContent = `${activity.participants.length}/${activity.max_participants}`;

      // Participants list
      const participantsList = node.querySelector(".participants-list");
      const noParticipants = node.querySelector(".no-participants");
      participantsList.innerHTML = "";

      if (Array.isArray(activity.participants) && activity.participants.length > 0) {
        noParticipants.classList.add("hidden");
        activity.participants.forEach((p) => {
          const li = document.createElement("li");
          li.className = "participant-row";

          const nameSpan = document.createElement("span");
          nameSpan.className = "participant-email";
          nameSpan.textContent = p;

          const removeBtn = document.createElement("button");
          removeBtn.className = "participant-remove";
          removeBtn.title = `Remove ${p}`;
          removeBtn.innerHTML = `&times;`;
          removeBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            // call unregister endpoint
            try {
              const resp = await fetch(`/activities/${encodeURIComponent(activity.name)}/unregister?email=${encodeURIComponent(p)}`, { method: "POST" });
              if (resp.ok) {
                await loadActivities();
              } else {
                const err = await resp.json();
                showMessage(err.detail || 'Failed to remove participant', 'error');
              }
            } catch (err) {
              console.error('Error unregistering participant', err);
              showMessage('Failed to remove participant', 'error');
            }
          });

          li.appendChild(nameSpan);
          li.appendChild(removeBtn);
          participantsList.appendChild(li);
        });
      } else {
        noParticipants.classList.remove("hidden");
      }

      // Hook up signup button (if desired)
      const signupBtn = node.querySelector(".signup-btn");
      signupBtn.addEventListener("click", () => {
        const email = document.getElementById("email").value;
        if (!email) {
          showMessage("Enter an email in the signup form first.", "error");
          return;
        }
        signUpForActivity(activity.name, email).then(() => loadActivities());
      });

      list.appendChild(node);
    });

    // Also refresh the select options for the signup form
    const select = document.getElementById("activity");
    select.innerHTML = `<option value="">-- Select an activity --</option>`;
    activities.forEach((a) => {
      const opt = document.createElement("option");
      opt.value = a.name;
      opt.textContent = a.name;
      select.appendChild(opt);
    });
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
