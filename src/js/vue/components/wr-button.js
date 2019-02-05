Vue.component('wr-button', {
    methods: {
        emitButtonClicked: function() {
            this.$emit('button-clicked');
        }
    },
    template: ' <section class="wr-button-container">\
                    <button type="button" @click="emitButtonClicked" class="wr-button">\
                        <h1 class="wr-button-text">What\'s WR?</h1>\
                    </button>\
                </section>'
});