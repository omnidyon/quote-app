import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Button } from './button';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  imports: [Button],
  template: `<app-button>Click me</app-button>`,
})
class HostComponent {}

describe('Button', () => {
 it('should render projected content', () => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
    });

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Click me');
  });

  it('should apply disabled state', () => {
    TestBed.configureTestingModule({
      imports: [Button],
    });

    const fixture = TestBed.createComponent(Button);
    const component = fixture.componentInstance;

    component.disabled.set(true);
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBe(true);
  });

  it('should respect provided type', () => {
    TestBed.configureTestingModule({
      imports: [Button],
    });

    const fixture = TestBed.createComponent(Button);
    const component = fixture.componentInstance;

    component.type.set('submit');
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('type')).toBe('submit');
  });
});
