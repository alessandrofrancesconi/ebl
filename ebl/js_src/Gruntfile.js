module.exports = function(grunt) {
    'use strict';
    
    // List required source files that will be built into ebl.js
    var base = [
        'ebl.js',
        'jsdoc_global.js',
        'polyfills/*.js',
        'public.js',
        'utils/*.js',
        'api/*.js',
        'dom/*.js',
        'gui/*.js',
        'gui/dialogs/*.js',
        'gui/toolbars/*.js',
        'state/*.js'
    ];

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: '\n\n',
                process: function(src, filepath) {
                    return src.replace(/@DEBUG/g, grunt.config.get('pkg.debug'))
                              .replace(/@VERSION/g, grunt.config.get('pkg.version'))
                              .replace(/@YEAR/g, new Date().getFullYear())
                              .replace(/@HOMEPAGE/g, grunt.config.get('pkg.homepage'))
                              .replace(/@AUTHOR/g, grunt.config.get('pkg.author.name'))
                              .replace(/@AUTHOMEPAGE/g, grunt.config.get('pkg.author.url'))
                              .replace(/@LICENSE/g, grunt.config.get('pkg.license'));
                }
            },
            dist: {
                src: base,
                dest: '../<%= pkg.name %>.js',
                options: {
                    banner: ";(function(window, undefined){\n 'use strict';\n",
                    footer: "}(window));"
                }
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> (<%= grunt.template.today("yyyy-mm-dd") %>) */\n',
                sourceMap: false
            },
            build: {
                files: {
                    '../<%= pkg.name %>.min.js': '../<%= pkg.name %>.js'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['concat', 'uglify']);
};

