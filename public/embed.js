(function() {
  // Create a container for the chat widget
  const chatContainer = document.createElement('div');
  chatContainer.id = 'aura-dental-chat-widget';
  document.body.appendChild(chatContainer);
  // Create an iframe
  const iframe = document.createElement('iframe');
  // Set iframe styles for a floating widget
  iframe.style.position = 'fixed';
  iframe.style.bottom = '0';
  iframe.style.right = '0';
  iframe.style.width = '400px'; // A bit larger to contain the widget's shadow and pop-up
  iframe.style.height = '550px';
  iframe.style.border = 'none';
  iframe.style.zIndex = '999999';
  iframe.style.backgroundColor = 'transparent';
  // Set the source of the iframe to the widget page
  // In production, this would be the absolute URL of your deployed app.
  // For local dev, it assumes the script is served from the same origin.
  iframe.src = '/widget';
  // Append the iframe to the container
  chatContainer.appendChild(iframe);
})();