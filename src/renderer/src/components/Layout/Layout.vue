<template>
    <div class="flex flex-col h-screen w-screen">
        <Header />
        <AddressBar />
        <div class="flex flex-1 min-h-0 overflow-hidden">
            <Sidebar />
            <div class="flex-1 h-full relative bg-[red]"></div>
        </div>
    </div>
</template>
<script setup lang="ts">

import { Sidebar, Header, AddressBar, TabBar } from './index'
</script>