// Function to format date to yyyy-mm-dd
function formatDateToYYYYMMDD(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear(); // Get year
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Get month (0-indexed) and pad
  const day = String(date.getDate()).padStart(2, "0"); // Get day and pad with leading zero
  return `${year}-${month}-${day}`; // Return formatted date
}

// Add Expense Form Submission
document
  .getElementById("add-expense-form")
  ?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    // Get user input values
    const dateInput = formData.get("date"); // YYYY-MM-DD format from input
    const amountInput = formData.get("amount");
    const descriptionInput = formData.get("description");
    const categoryInput = formData.get("category");
    const paymentMethodInput = formData.get("paymentMethod");
    // Convert to yyyy-mm-dd format
    const formattedDate = formatDateToYYYYMMDD(dateInput);

    // Prepare data to send to the server
    const data = {
      date: formattedDate, // Use the correctly formatted date
      amount: amountInput,
      description: descriptionInput,
      category: categoryInput,
      paymentMethod: paymentMethodInput,
    };

    const response = await fetch("/add-expense", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert("Expense added successfully!");
      window.location.href = "/view_expense.html"; // Redirect to view expenses
    } else {
      alert("Failed to add expense.");
    }
  });

// Fetch and display expenses on the view expense page
if (document.getElementById("expense-list")) {
  fetch("/expenses")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((expenses) => {
      const expenseList = document.getElementById("expense-list");
      expenses.forEach((expense, index) => {
        const formattedDate = formatDateToYYYYMMDD(expense.date); // Format date for display
        const row = document.createElement("tr");
        row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${formattedDate}</td>
                    <td>${expense.amount}</td>
                    <td>${expense.description}</td>
                    <td>${expense.category}</td>
                    <td>${expense.paymentMethod}</td>
                    <td>
                        <button onclick="editExpense(${
                          expense.id
                        })">Edit</button>
                        <button onclick="deleteExpense(${
                          expense.id
                        })">Delete</button>
                    </td>
                `;
        expenseList.appendChild(row);
      });
    })
    .catch((error) => console.error("Error fetching expenses:", error));
}

// Function to edit an expense
function editExpense(id) {
  window.location.href = `/edit_expense.html?id=${id}`; // Redirect to edit page
}

// Function to delete an expense
function deleteExpense(id) {
  fetch(`/delete-expense/${id}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (response.ok) {
        alert("Expense deleted successfully!");
        location.reload(); // Refresh the page to see updated expenses
      } else {
        alert("Failed to delete expense.");
      }
    })
    .catch((error) => console.error("Error deleting expense:", error));
}

// Edit Expense Functionality
const urlParams = new URLSearchParams(window.location.search);
const expenseId = urlParams.get("id"); // Get the expense ID from the URL

if (document.getElementById("edit-expense-form")) {
  // Define the function to load the expense data when the page loads
  async function loadExpenseData(expenseId) {
    try {
      const response = await fetch(`/api/edit_expense/${expenseId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const expense = await response.json();

      // Format the date to 'yyyy-mm-dd'
      const formattedDate = new Date(expense.expense.date)
        .toISOString()
        .split("T")[0];

      // Populate the form with expense data
      document.getElementById("amount").value = expense.expense.amount;
      document.getElementById("category").value = expense.expense.category;
      document.getElementById("paymentMethod").value =
        expense.expense.paymentMethod;
      document.getElementById("description").value =
        expense.expense.description;
      document.getElementById("date").value = formattedDate;
    } catch (error) {
      console.error("Error loading expense data:", error);
    }
  }

  // Load expense data on page load
  loadExpenseData(expenseId);

  document
    .getElementById("edit-expense-form")
    .addEventListener("submit", function (e) {
      e.preventDefault(); // Prevent the default form submission

      const date = document.getElementById("date").value;
      const amount = document.getElementById("amount").value;
      const description = document.getElementById("description").value;
      const category = document.getElementById("category").value;
      const paymentMethod = document.getElementById("paymentMethod").value;

      // Convert to yyyy-mm-dd format
      const formattedDate = formatDateToYYYYMMDD(date);

      fetch(`/edit-expense/${expenseId}`, {
        method: "PUT", // Update the expense
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: formattedDate, // Send formatted date
          amount,
          description,
          category,
          paymentMethod,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Network response was not ok " + response.statusText
            );
          }
          return response.json();
        })
        .then((data) => {
          console.log(data.message);
          window.location.href = "/view_expense.html"; // Redirect after successful update
        })
        .catch((error) => {
          console.error("Error updating expense:", error);
        });
    });
}
