export default {
  routes: [
    {
      method: "POST",
      path: "/meetings/:id/join",
      handler: "custom.joinMeeting",
      auth: true,
    },
    {
      method: "POST",
      path: "/meetings",
      handler: "custom.create",
      auth: true,
    },
  ],
};
