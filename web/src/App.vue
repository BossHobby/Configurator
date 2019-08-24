<template>
  <div id="app">
    <b-navbar>
      <b-navbar-brand to="/">QUICKSILVER</b-navbar-brand>
      <b-navbar-nav>
        <b-nav-item to="/">Profile</b-nav-item>
        <b-nav-item to="/plot">Plot</b-nav-item>
      </b-navbar-nav>
      <b-navbar-nav class="ml-auto">
        <b-nav-form v-on:submit.prevent="connect" right>
          <b-button size="sm" class="my-2 my-sm-0" type="submit">Connect</b-button>
        </b-nav-form>
      </b-navbar-nav>
    </b-navbar>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: "app",
  methods: {
    connect() {
      fetch("http://localhost:8000/api/connect", {
        method: "POST"
      })
        .then(res => res.json())
        .then(res => {
          // eslint-disable-next-line
          console.log(res);
        });
    }
  },
  created() {}
};
</script>

<style>
</style>
