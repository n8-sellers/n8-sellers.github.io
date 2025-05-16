---
layout: default
title: Home
---

# Welcome to NetLog

A blog exploring network engineering concepts, tools, and best practices.

## Recent Posts

{% for post in site.posts %}
- [{{ post.title }}]({{ post.url | relative_url }}) - {{ post.date | date: "%B %d, %Y" }}
{% endfor %}
