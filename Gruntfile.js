module.exports = function (grunt){
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.initConfig({
        uglify: {
            options: {
                banner: '/* Mosaik\n' +
                        ' * ======\n' +
                        ' * @license: CC BY-NC 3.0 (http://creativecommons.org/licenses/by-nc/3.0/)\n' +
                        ' * @author: Christian Engel <hello@wearekiss.com>\n' +
                        ' * @updated: ' + (new Date()).toDateString() + '\n' +
                        ' */\n',
                sourceMap: 'dist/mosaik.min.smap.js'
            },
            dist: {
                src: ['src/mosaik.Core.js', 'src/mosaik.Events.js', 'src/mosaik.Input.js', 'src/mosaik.Map.js', 'src/mosaik.Palette.js', 'src/mosaik.Stage.js', 'src/mosaik.Object.js', 'src/mosaik.Tween.js'],
                dest: 'dist/mosaik.min.js'
            }
        },
        concat: {
            options: {
                banner: '/* Mosaik - Tilebased Engine\n' +
                        ' * ======\n' +
                        ' * @license: CC BY-NC 3.0 (http://creativecommons.org/licenses/by-nc/3.0/)\n' +
                        ' * @author: Christian Engel <hello@wearekiss.com>\n' +
                        ' * @updated: ' + (new Date()).toDateString() + '\n' +
                        ' */\n'
            },
            dist: {
                src: ['src/mosaik.Core.js', 'src/mosaik.Events.js', 'src/mosaik.Input.js', 'src/mosaik.Map.js', 'src/mosaik.Palette.js', 'src/mosaik.Stage.js', 'src/mosaik.Object.js', 'src/mosaik.Tween.js'],
                dest: 'dist/mosaik.js'
            }
        },
        watch: {
            scripts: {
                files: ['src/*.js'],
                tasks: ['uglify', 'concat'],
                options: {
                    nospawn: true
                }
            }
        }
    });

    grunt.registerTask('default', 'uglify');
};